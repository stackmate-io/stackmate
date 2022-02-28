import fs from 'fs';
import os from 'os';
import faker from 'faker';
import sinon from 'sinon';
import { join as joinPaths } from 'path';
import { Construct } from 'constructs';
import { Manifest, Testing } from 'cdktf';

import Project from '@stackmate/core/project';
import Service from '@stackmate/core/service';
import Environment from '@stackmate/lib/environment';
import DeployOperation from '@stackmate/operations/deploy';
import ServiceRegistry from '@stackmate/core/registry';
import { CloudStack } from '@stackmate/interfaces';
import { FactoryOf, ProviderChoice, ServiceAttributes } from '@stackmate/types';
import { ENVIRONMENT_VARIABLE, PROVIDER, SERVICE_TYPE } from '@stackmate/constants';

/**
 * Enhances the terraform stack with the properties we apply in the Stack class
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
 * Returns the prerequisites to use for service provisioning
 *
 * @param {Object} options
 * @param {ProviderChoice} options.provider the provider for the prerequisites
 * @param {String} options.region the rgion for the prerequisites
 * @returns {Object} the prerequisites for the service registration
 */
export const getPrerequisites = (
  { provider, region }: { provider: ProviderChoice, region: string },
) => {
  const cloudProvider = ServiceRegistry.get({ provider, type: SERVICE_TYPE.PROVIDER }).factory({
    name: `provider-${provider}-default`,
    provider,
    region,
  });

  const vaultAttrs = {
    name: `project-vault-${provider}`,
    provider,
    region,
  }

  if (provider === PROVIDER.AWS) {
    const awsAccount = 111122223333;
    const awsHash = '1234abcd-12ab-34cd-56ef-1234567890ab';

    Object.assign(vaultAttrs, {
      key: `arn:aws:kms:${region}:${awsAccount}:key/${awsHash}`,
    });
  }

  const vault = ServiceRegistry.get({ provider, type: SERVICE_TYPE.VAULT }).factory(vaultAttrs);

  return {
    cloudProvider: cloudProvider.scope('deployable'),
    vault: vault.scope('deployable'),
  };
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
  provider, serviceClass, serviceConfig, stackName = 'production',
}: {
  provider: ProviderChoice;
  serviceClass: FactoryOf<Service>;
  serviceConfig: Omit<ServiceAttributes, 'provider'>;
  stackName?: string;
}): Promise<{
  scope: string;
  variables: object;
  [name: string]: any;
}> => {
  const synthesize = (): Promise<{ [name: string]: any }> => {
    let scope: string;

    const { region } = serviceConfig;
    const { cloudProvider, vault } = getPrerequisites({ provider, region });

    const synth = (): Promise<{ [name: string]: any }> => (
      new Promise((resolve) => {
        scope = Testing.synthScope((stack) => {
          const cloudStack = enhanceStack(stack, { name: stackName });

          const service = serviceClass.factory(serviceConfig).scope('deployable');

          // Register the prerequisites
          cloudProvider.register(cloudStack);
          vault.register(cloudStack);
          service.link(cloudProvider);
          if (service.isAuthenticatable) {
            service.link(vault);
          }

          service.register(cloudStack);

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
export const deployProject = async (
  projectConfig: object,
  stageName: string = 'production',
  secrets: object = {},
): Promise<{ scope: string, stack: CloudStack, output: string }> => {
  // Set the app's output path to the temp directory
  sinon.stub(Environment, 'get').withArgs(ENVIRONMENT_VARIABLE.OUTPUT_DIR).returns(os.tmpdir());
  const project = Project.factory(projectConfig);

  const operation = new DeployOperation(project, stageName);
  await operation.run();

  const { provisioner: { stack } } = operation;

  return {
    stack,
    scope: JSON.stringify(stack.toTerraform(), null, 2),
    output: stack.outputPath,
  };
};
