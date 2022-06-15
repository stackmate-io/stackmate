import fs from 'fs';
import os from 'os';
import { faker } from '@faker-js/faker';
import { join as joinPaths } from 'path';
import { Construct } from 'constructs';
import { Manifest, Testing } from 'cdktf';

import Registry from '@stackmate/engine/core/registry';
import { deployment } from '@stackmate/engine/core/operation';
import { PROVIDER } from '@stackmate/engine/constants';
import { awsProviderConfiguration, awsVaultConfiguration } from 'tests/fixtures/aws';
import {
  BaseService,
  CloudStack,
  ProviderChoice,
  RequireKeys,
  ServiceScopeChoice,
  ProjectConfiguration,
  BaseServices,
} from '@stackmate/engine/types';

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
 * @param {String} targetDir the path to write the output to
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
 * @param {String} options.region the region for the prerequisites
 * @param {String} options.projectName the project's name
 * @param {String} options.stageName the stage's name
 * @returns {CloudService[]} the prerequisites for the service registration
 */
export const getPrerequisites = ({ provider, stack, scope, projectName, stageName }: {
  provider: ProviderChoice,
  stack: CloudStack,
  scope: ServiceScopeChoice,
  projectName: string;
  stageName: string;
}): {
  provider: BaseServices.Provider.Type,
  vault: BaseServices.Vault.Type,
} => {
  let providerAttrs;
  let vaultAttrs;

  switch (provider) {
    case PROVIDER.AWS:
      providerAttrs = awsProviderConfiguration;
      vaultAttrs = awsVaultConfiguration;
      break;
    default:
      throw new Error(`We don't have any prerequisites fixture for ${provider}`);
  }

  const cloudProvider = Registry.get(
    providerAttrs.provider, providerAttrs.type,
  ).factory(
    providerAttrs, projectName, stageName,
  ).scope(scope) as BaseServices.Provider.Type;

  cloudProvider.provisions(stack, {});

  const vault = Registry.get(
    vaultAttrs.provider, vaultAttrs.type,
  ).factory(
    vaultAttrs, projectName, stageName,
  ).scope(scope) as BaseServices.Vault.Type;

  vault.provisions(stack, { provider: cloudProvider });

  return {
    provider: cloudProvider,
    vault,
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
  stageName,
  projectName,
  serviceConfig,
  serviceScope = 'deployable',
  prerequisitesScope = 'deployable',
}: {
  projectName: string;
  stageName: string;
  serviceConfig: RequireKeys<BaseService.Attributes, 'provider' | 'type'>
  serviceScope?: ServiceScopeChoice,
  prerequisitesScope?: ServiceScopeChoice,
}): Promise<{
  scope: string;
  variables: object;
  [name: string]: any;
}> => {
  const synthesize = (): Promise<{ [name: string]: any }> => {
    let scope: string;

    const { provider } = serviceConfig;
    const synth = (): Promise<{ [name: string]: any }> => (
      new Promise((resolve) => {
        scope = Testing.synthScope((stack) => {
          const cloudStack = enhanceStack(stack, { name: stageName });
          const prerequisites = getPrerequisites({
            provider, stack: cloudStack, scope: prerequisitesScope, projectName, stageName,
          });

          const service = Registry.get(
            serviceConfig.provider, serviceConfig.type,
          ).factory(
            serviceConfig, projectName, stageName,
          ).scope(serviceScope);

          service.provisions(cloudStack, prerequisites);

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
 * @returns {Object} the scope as string and stack as object
 */
export const deployProject = (
  projectConfig: ProjectConfiguration, stageName: string = 'production',
): {
  scope: string, stack: CloudStack, output: string,
} => {
  const outputPath = os.tmpdir();
  const provisioner = deployment(projectConfig, stageName, { outputPath });
  const scope = provisioner.synthesize();

  return {
    stack: provisioner.stack,
    scope: JSON.stringify(scope, null, 2),
    output: outputPath,
  };
};
