import fs from 'fs';
import os from 'os';
import faker from 'faker';
import sinon from 'sinon';
import YAML from 'yaml';
import { join as joinPaths } from 'path';
import { Construct } from 'constructs';
import { Testing } from 'cdktf';

import Service from '@stackmate/core/service';
import Stack from '@stackmate/core/stack';
import Project from '@stackmate/core/project';
import { CloudStack } from '@stackmate/interfaces';
import { FactoryOf, ProviderChoice } from '@stackmate/types';
import { PROVIDER } from '@stackmate/constants';
import { getAwsPrerequisites } from './mocks';
import { getAwsParamsStubber } from './stubs';

export const enhanceStack = (stack: Construct, {
  name, targetPath, synthesize,
}: { name?: string, targetPath?: string, synthesize?: Function } = {}): CloudStack => {
  Object.defineProperties(stack, {
    name: {
      value: name || faker.internet.domainWord(),
      writable: false,
    },
    targetPath: {
      value: targetPath || faker.system.directoryPath(),
      writable: false,
    },
    synthesize: {
      value: synthesize || ((): void => {}),
    },
  });

  return stack as CloudStack;
};

/**
 * Provisions a service into the stack and returns the result
 *
 * @param {Object} options
 * @param {ProviderChoice} options.provider the cloud provider (used to get the prerequisites)
 * @param {Service} options.serviceClass the class of the service to provision
 * @param {Object} options.serviceConfig the service's attributes
 * @param {String} options.stackName the name of the mock stack
 * @returns {Promise<Object>}
 */
export const getServiceProvisionResults = async ({
  provider, serviceClass, serviceConfig, stackName = 'production', withPrerequisites = true,
}: {
  provider: ProviderChoice;
  serviceClass: FactoryOf<Service>;
  serviceConfig: object;
  stackName?: string;
  withPrerequisites?: boolean;
}): Promise<{
  scope: string;
  variables: object;
  [name: string]: any;
}> => {
  let prerequisitesGenerator = ({ stack }: { stack: CloudStack }) => ({});

  if (withPrerequisites) {
    if (provider === PROVIDER.AWS) {
      prerequisitesGenerator = getAwsPrerequisites;
    }
  }

  const synthesize = (): Promise<{ [name: string]: any }> => {
    let scope: string;

    const synth = (): Promise<{ [name: string]: any }> => (
      new Promise((resolve) => {
        scope = Testing.synthScope((stack) => {
          const cloudStack = enhanceStack(stack, { name: stackName });

          const service = serviceClass.factory(
            serviceConfig, cloudStack, prerequisitesGenerator({ stack: cloudStack }),
          );

          const { variable: variables, ...terraform } = cloudStack.toTerraform();

          resolve({ service, variables, ...terraform });
        });
      })
    );

    return new Promise(async (wrapperResolve) => {
      const synthResult = await synth();
      return wrapperResolve({ scope, ...synthResult });
    });
  };

  const { scope, service, variables, ...terraform } = await synthesize();
  return { scope, service, variables, ...terraform };
};

/**
 * Synthesizes a project based on a given configuration
 *
 * @param {Object} projectConfig the project configuration. Should be the object representation
 *                               of the supposed YAML file that represents the project
 * @param {String} stageName the stage name to use
 * @param {Object} secrets the service's secrets to be used
 * @returns {Object} the scope as string and stack as object
 */
export const synthesizeProject = async (
  projectConfig: object,
  secrets: object = {},
  stageName: string = 'production',
): Promise<{ scope: string, stack: object }> => {
  const inputPath = joinPaths(os.tmpdir(), 'input-files', '.stackmate', 'config.yml');

  // Stub the readFile that is used in projet file loading, to return the project config we set
  const readStub = sinon.stub(fs.promises, 'readFile');
  readStub.withArgs(inputPath).resolves(YAML.stringify(projectConfig));
  (fs.promises.readFile as sinon.SinonStub).callThrough();

  // Same for the existsSync call
  const existsStub = sinon.stub(fs, 'existsSync');
  existsStub.withArgs(inputPath).returns(true);
  (fs.existsSync as sinon.SinonStub).callThrough();

  // Spy the `toTerraform` method that is used internally by CDKTF
  const stackSpy = sinon.spy(Stack.prototype, 'toTerraform');

  const { stub: stubAwsSSM, restore: restoreAwsSSM } = getAwsParamsStubber();

  // Stub the SSM parameters
  stubAwsSSM();

  // Synthesize the project
  await Project.synthesize(inputPath, stageName);

  // Now that the project is synthesized, get the scope to perform assertions with
  const [stack] = stackSpy.returnValues;
  const scope = JSON.stringify(stack, null, 2);

  // Restore the stubs
  readStub.restore();
  existsStub.restore();
  restoreAwsSSM();

  return { scope, stack };
};
