import { camelCase, fromPairs } from 'lodash';

import Project from './core/project';
import Registry from './core/registry';
import DeployOperation from './operations/deploy';
import DestroyOperation from './operations/destroy';
import PrepareOperation from './operations/prepare';
import { AWS_REGIONS } from './providers/aws/constants';
import { generateWords, uniqueIdentifier } from './lib/helpers';
import { DEFAULT_REGION, PROVIDER, SERVICE_TYPE } from './constants';
import {
  OperationOptions,
  PrepareOperationOptions,
  ServiceTypeChoice,
  ProjectConfigCreationOptions,
  Project as StackmateProject,
  ProjectConfiguration,
  CoreServiceConfiguration,
  StateServiceAttributes,
  VaultServiceAttributes,
} from './types';

// Export types
export * from './types';

// Export constants
export * from './constants';

// Export Provider constants
export * from './providers/aws/constants';

// Export error classes
export * from './lib/errors';

// Export core objects
export {
  Project,
  Registry,
};

// Project configuration
export namespace ProjectConfig {
  /**
   * Populates a project's configuration by
   *
   * @param {Object} options the project's configuration options
   * @param {String} options.name the project's name
   * @param {ProviderChoice} options.defaultProvider the default cloud provider
   * @param {ProviderChoice} options.stateProvider the provider to use for the state
   * @param {ProviderChoice} options.secretsProvider the provider to use for storing the secrets
   * @param {String} options.defaultRegion the default region to use for the default cloud provider
   * @param {String[]} options.stageNames the names of the stages to use
   * @param {ServiceTypeChoice[]} options.serviceTypes the types of services to include
   * @returns {EntityAttributes}
   */
  export const populate = ({
    projectName = '',
    defaultProvider = PROVIDER.AWS,
    stateProvider = PROVIDER.AWS,
    secretsProvider = PROVIDER.AWS,
    defaultRegion = AWS_REGIONS.EU_CENTRAL_1,
    stageNames = ['production'],
    serviceTypes = [],
  }: ProjectConfigCreationOptions): ProjectConfiguration => {
    const [stageName, ...otherStages] = stageNames;
    const provider = defaultProvider || PROVIDER.AWS;
    const region = defaultRegion || DEFAULT_REGION[provider];
    const name = projectName || generateWords({ words: 2 });

    const state = Registry.get(stateProvider || provider, SERVICE_TYPE.STATE).config({
      projectName: name, stageName,
    });
    const vault = Registry.get(secretsProvider || provider, SERVICE_TYPE.VAULT).config({
      projectName: name, stageName,
    });

    const config = {
      name,
      provider,
      region,
      state: state as CoreServiceConfiguration<StateServiceAttributes>,
      secrets: vault as CoreServiceConfiguration<VaultServiceAttributes>,
      stages: {
        [stageName]: fromPairs(
          serviceTypes.map((type: ServiceTypeChoice) => {
            const cfg = Registry.get(provider, type).config({
              projectName: name,
              stageName: stageName,
            });

            const serviceName = camelCase(cfg.name || uniqueIdentifier(type, { stageName }));
            return [serviceName, cfg];
          }),
        ),
        ...fromPairs(
          otherStages.map((stg: string) => ([stg, { copy: stageName }])),
        ),
      },
    };

    // Validate the configuration
    Project.factory<StackmateProject.Type>(config);

    return config;
  };
}

// Export operations
export namespace Operations {
  /**
   * Returns a deployment operation
   *
   * @param {ProjectConfiguration} config the project's configuration
   * @param {String} stage the stage to operate
   * @param {OperationOptions} options any options to pass to the operation
   * @returns {DeployOperation} the operation instance
   */
  export const deployment = (
    config: StackmateProject.Attributes, stage: string, options: OperationOptions = {},
  ) => (
    new DeployOperation(Project.factory<StackmateProject.Type>(config).stage(stage), options)
  );

  /**
   * Returns a destruction operation
   *
   * @param {ProjectConfiguration} config the project's configuration
   * @param {String} stage the stage to operate
   * @param {OperationOptions} options any options to pass to the operation
   * @returns {DeployOperation} the operation instance
   */
  export const destroy = (
    config: StackmateProject.Attributes, stage: string, options: OperationOptions = {},
  ) => (
    new DestroyOperation(Project.factory<StackmateProject.Type>(config).stage(stage), options)
  );

  /**
   * Returns a preparation operation
   *
   * @param {ProjectConfiguration} config the project's configuration
   * @param {String} stage the stage to operate
   * @param {OperationOptions} options any options to pass to the operation
   * @returns {DeployOperation} the operation instance
   */
  export const prepare = (
    config: StackmateProject.Attributes, stage: string, options: PrepareOperationOptions = {},
  ) => (
    new PrepareOperation(Project.factory<StackmateProject.Type>(config).stage(stage), options)
  );
};
