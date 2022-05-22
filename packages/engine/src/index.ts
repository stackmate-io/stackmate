import { fromPairs, isEmpty, isNil, omitBy } from 'lodash';

import Project from './core/project';
import Registry from './core/registry';
import DeployOperation from './operations/deploy';
import DestroyOperation from './operations/destroy';
import PrepareOperation from './operations/prepare';
import { AWS_REGIONS } from './providers/aws/constants';
import { ValidationError } from './lib/errors';
import {
  DEFAULT_PROFILE_NAME,
  DEFAULT_STATE_SERVICE_NAME,
  DEFAULT_VAULT_SERVICE_NAME,
  PROVIDER, SERVICE_TYPE,
} from './constants';
import {
  OperationConstructor,
  OperationOptions,
  PrepareOperationOptions,
  ProjectConfiguration,
  ProviderChoice,
  ServiceTypeChoice,
  StackmateOperation,
  ProjectConfigOptions,
  ServiceConfigurationDeclaration,
  EntityAttributes,
  ServiceConstructor,
  Project as StackmateProject,
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

/**
 * Returns an operation based on a given class
 *
 * @param {OperationConstructor} Cls the class to instantiate
 * @param {ProjectConfiguration} config the project's configuration
 * @param {String} stage the stage to operate
 * @param {OperationOptions} options any options to pass to the operation
 * @returns {StackmateOperation} the operation instance
 */
const getOperation = (
  Cls: OperationConstructor,
  config: ProjectConfiguration,
  stage: string,
  options: OperationOptions = {},
): StackmateOperation => {
  const project = Project.factory<StackmateProject.Type>(config)
  return new Cls(project, stage, options);
};

// Project configuration
export namespace ProjectConfig {
  /**
   * Returns the service's defaults
   *
   * @param {ProviderChoice} provider the provider to get the service attributes for
   * @param {ServiceTypeChoice} service the service type
   * @returns {Object} the service's defaults
   */
  export const serviceDefaults = (
    provider: ProviderChoice,
    service: ServiceTypeChoice,
    region: string,
    impliedDefaults: Partial<EntityAttributes> = {},
  ): Partial<ServiceConfigurationDeclaration> => {
    let serviceProvider: ProviderChoice = provider;
    const serviceProviders = Registry.providers(service);

    if (!serviceProviders.includes(provider)) {
      ([serviceProvider] = serviceProviders);
    }

    const srv: ServiceConstructor = Registry.get(serviceProvider, service);
    const attrs = { ...srv.defaults(), type: service, provider, region };

    return omitBy(attrs, (val, key) => (
      isNil(val) || isEmpty(val) || (
        Boolean(impliedDefaults[key]) && impliedDefaults[key] === val
      )
    ));
  }

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
    name,
    defaultProvider = PROVIDER.AWS,
    stateProvider = PROVIDER.AWS,
    secretsProvider = PROVIDER.AWS,
    defaultRegion = AWS_REGIONS.EU_CENTRAL_1,
    stageNames = ['production'],
    serviceTypes = [],
  }: ProjectConfigOptions): [ProjectConfiguration, object] => {
    const [defaultStage, ...otherStages] = stageNames;
    const impliedDefaults = {
      provider: defaultProvider,
      region: defaultRegion,
      profile: DEFAULT_PROFILE_NAME,
    };

    const state = serviceDefaults(stateProvider, SERVICE_TYPE.STATE, defaultRegion, {
      ...impliedDefaults,
      type: SERVICE_TYPE.STATE,
      name: DEFAULT_STATE_SERVICE_NAME,
    });

    const secrets = serviceDefaults(secretsProvider, SERVICE_TYPE.VAULT, defaultRegion, {
      ...impliedDefaults,
      type: SERVICE_TYPE.VAULT,
      name: DEFAULT_VAULT_SERVICE_NAME,
    });

    const config = {
      name,
      provider: defaultProvider,
      region: defaultRegion,
      state,
      secrets,
      stages: {
        [defaultStage]: fromPairs(
          serviceTypes.map((service: ServiceTypeChoice) => (
            [service, serviceDefaults(defaultProvider, service, defaultRegion, impliedDefaults)]
          )),
        ),
        ...fromPairs(
          otherStages.map((stg: string) => ([stg, { from: defaultStage }])),
        ),
      },
    };

    let errors = {};
    try {
      Project.factory(config);
    } catch (err) {
      if (err instanceof ValidationError) {
        errors = err.errors;
        console.log('errors', require('util').inspect(err));
      }
    }

    return [config, errors];
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
    config: ProjectConfiguration, stage: string, options: OperationOptions = {},
  ) => (
    getOperation(DeployOperation, config, stage, options)
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
    config: ProjectConfiguration, stage: string, options: OperationOptions = {},
  ) => (
    getOperation(DestroyOperation, config, stage, options)
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
    config: ProjectConfiguration, stage: string, options: PrepareOperationOptions = {},
  ) => (
    getOperation(PrepareOperation, config, stage, options)
  );
};
