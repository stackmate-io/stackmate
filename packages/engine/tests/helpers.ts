import fs from 'fs';
import os from 'os';
import faker from 'faker';
import sinon from 'sinon';
import YAML from 'yaml';
import { join as joinPaths } from 'path';
import { Construct } from 'constructs';
import { Manifest, Testing } from 'cdktf';

import Project from '@stackmate/core/project';
import Service from '@stackmate/core/service';
import Environment from '@stackmate/lib/environment';
import { CloudStack } from '@stackmate/interfaces';
import { FactoryOf, ProviderChoice } from '@stackmate/types';
import { ENVIRONMENT_VARIABLE, PROVIDER } from '@stackmate/constants';
import { getAwsPrerequisites } from 'tests/mocks';

/**
 *
 * @param {TerraformStack} stack the stack to enhance
 * @param {Object} opts
 * @param {String} opts.name the name for the stack
 * @param {String} opts.name the name for the stack
 * @returns
 */
export const enhanceStack = (
  stack: Construct, { name, synthesize }: { name?: string, synthesize?: Function } = {},
): CloudStack => {
  Object.defineProperties(stack, {
    name: {
      value: name || faker.internet.domainWord(),
      writable: false,
    },
    synthesize: {
      value: synthesize || ((): void => {}),
    },
  });

  return stack as CloudStack;
};

/**
 * Writes out the stack as a JSON file
 *
 * @param {Object} obj the object to store on the json file
 * @param {String} targetPath the path to write the output to
 * @param {String} filename the target filename
 */
export const writeManifestFile = (obj: object, targetDir: string): string => {
  const fileName = joinPaths(targetDir, Manifest.fileName);
  fs.writeFileSync(fileName, JSON.stringify(obj, undefined, 2));
  return fileName;
};

/**
 * Writes contents to a manifest file, runs a callback and removes the file afterwards
 *
 * @param {String} contents the contents to write to the manifest file
 * @param {Function} callback the callback function
 */
export const withEphemeralManifest = (
  contents: string, callback: (obj: { path: string, fileName: string }) => void,
) => {
  const targetDir = os.tmpdir();
  const fileName = joinPaths(targetDir, Manifest.fileName);
  fs.writeFileSync(fileName, JSON.stringify(contents, undefined, 2));
  callback({ path: targetDir, fileName });
  fs.unlinkSync(fileName);
};

/**
 * Registers a service into the stack and returns the result
 *
 * @param {Object} options
 * @param {ProviderChoice} options.provider the cloud provider (used to get the prerequisites)
 * @param {Service} options.serviceClass the class of the service to register
 * @param {Object} options.serviceConfig the service's attributes
 * @param {String} options.stackName the name of the mock stack
 * @returns {Promise<Object>}
 */
export const getServiceRegisterationResults = async ({
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

          service.register();

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
): Promise<{ scope: string, stack: CloudStack, output: string }> => {
  // Set the app's output path to the temp directory
  sinon.stub(Environment, 'get').withArgs(ENVIRONMENT_VARIABLE.OUTPUT_DIR).returns(os.tmpdir());

  const inputPath = joinPaths(os.tmpdir(), 'input-files', '.stackmate', 'config.yml');

  // Stub the readFile that is used in projet file loading, to return the project config we set
  const readStub = sinon.stub(fs.promises, 'readFile');
  readStub.withArgs(inputPath).resolves(YAML.stringify(projectConfig));
  (fs.promises.readFile as sinon.SinonStub).callThrough();

  // Same for the existsSync call
  const existsStub = sinon.stub(fs, 'existsSync');
  existsStub.withArgs(inputPath).returns(true);
  (fs.existsSync as sinon.SinonStub).callThrough();

  const project = await Project.load(inputPath);
  project.select(stageName).prepare();

  // Restore the stubs
  readStub.restore();
  existsStub.restore();

  const { stack } = project.stage;

  return {
    stack,
    scope: JSON.stringify(stack.toTerraform(), null, 2),
    output: stack.outputPath,
  };
};
