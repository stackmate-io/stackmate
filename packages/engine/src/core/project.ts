import { defaults, fromPairs, isEmpty, uniqBy } from 'lodash';

import { JSON_SCHEMA_ROOT, PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';

import { Registry } from '@stackmate/engine/core/registry';
import {
  getCloudServiceConditional, getCoreServiceConditional,
  getRegionConditional, getRegionsSchema, JsonSchema,
} from '@stackmate/engine/core/schema';
import {
  CloudServiceAttributes, CloudProviderChoice, CoreServiceAttributes,
  isCoreService, CloudService, CoreService, ProviderChoice, ServiceConfiguration,
} from '@stackmate/engine/core/service';

/**
 * @type {StageConfiguration} the configuration for the project stages
 */
export type StageConfiguration<IsPartial extends boolean = false> = {
  name: string;
  services?: IsPartial extends true ? Partial<CloudServiceAttributes>[] : CloudServiceAttributes[],
  copy?: string;
  skip?: string[];
};

/**
 * @type {Project} a project object
 */
export type Project = {
  name: string;
  provider: CloudProviderChoice;
  region: string;
  stages: StageConfiguration[];
  secrets: Omit<CoreServiceAttributes, 'type'>;
  state: Omit<CoreServiceAttributes, 'type'>;
};

/**
 * @type {ProjectConfiguration} the configuration object that creates a project
 */
export type ProjectConfiguration = Omit<Partial<Project>, 'stages'> & {
  stages?: StageConfiguration<true>[];
};

/**
 * Returns the list of the cloud services that are managed by the given stage
 *
 * @param {ProjectConfiguration} config the configuration object
 * @param {String} stage the stage to get
 * @param {String[]} skippedServices any names of services to skip (when copying the stage)
 * @returns {ServiceConfiguration[]} the cloud services deployed by this stage
 */
export const getCloudServices = (
  config: Project, stage: string, skippedServices: string[] = [],
): ServiceConfiguration[] => {
  const { provider: projectProvider, region: projectRegion = null, stages = [] } = config;

  if (isEmpty(stages)) {
    throw new Error('There aren’t any stages defined for the project');
  }

  const stageConfiguration = stages.find(s => s.name === stage);

  if (!stageConfiguration) {
    throw new Error(`Stage ${stage} is not available in the project`);
  }

  const {
    copy: copyFrom = null,
    skip = [],
    services: stageServices = [],
  } = stageConfiguration;

  if (isEmpty(stageServices) && !copyFrom) {
    throw new Error(
      `Stage ${stage} is improperly configured. It doesn't provide any services or stage to copy from`,
    );
  }

  const services = [];

  if (copyFrom) {
    services.push(...getCloudServices(config, copyFrom, skip));
  }

  services.push(...stageServices.filter(srv => !skippedServices.includes(srv.name)));

  // Form the cloud services configurations
  return services.map(srv => defaults({ ...srv }, {
    id: `${config.name}-${stage}`,
    provider: projectProvider,
    region: projectRegion,
  }));
};

/**
 * Returns the configuration for the provider services, given a list of cloud services
 * We basically extract provider and region from the service list and return relevant configs
 *
 * @param {Project} config the project configuration object
 * @param {String} stage the stage to get provider configurations for
 * @param {ServiceConfiguration[]} services the services to get the provider configurations by
 * @returns {CoreServiceAttributes[]} the provider configurations
 */
export const getProviderConfigurations = (
  config: Project, stage: string, services: ServiceConfiguration[] = [],
): ServiceConfiguration[] => {
  const { provider: projectProvider, region: projectRegion } = config;

  if (!projectProvider) {
    throw new Error('There is no provider set for the project');
  }

  const providers = services.map(({ provider = projectProvider, region = projectRegion }) => {
    const identifier = [provider, 'provider', (region || 'default'), stage].join('-');
    return {
      provider,
      region,
      id: identifier,
      name: identifier,
      type: SERVICE_TYPE.PROVIDER,
    };
  });

  return uniqBy(
    providers, ({ provider, region }) => (`provider-${provider}-region-${region || 'default'}`),
  );
};

/**
 * Returns the service configurations for the project and stage
 *
 * @param {String} stage the name of the stage to get configurations for
 * @returns {Function<ServiceConfiguration[]>} the configurations for the services to deploy
 */
export const getServiceConfigurations = (stage: string): (config: Project) => ServiceConfiguration[] => (config) => {
  const {
    provider: projectProvider,
    region: projectRegion,
    name: projectName,
    state: {
      provider: stateProvider = projectProvider,
      region: stateRegion = projectRegion,
    } = {},
    secrets: {
      provider: secretsProvider = projectProvider,
      region: secretsRegion = projectRegion,
    } = {},
  } = config;

  if (!projectProvider) {
    throw new Error('There is no provider set for the project');
  }

  const cloudServices = getCloudServices(config, stage);
  const providers = getProviderConfigurations(config, stage, cloudServices);

  // Predefined / core services => state & secrets
  const state = {
    id: `${projectName}-state-${stage}`,
    type: SERVICE_TYPE.STATE,
    provider: (stateProvider || projectProvider),
    region: (stateRegion || projectRegion),
    name: `${projectName}-project-state`,
  };

  const secrets = {
    id: `${projectName}-secrets-${stage}`,
    type: SERVICE_TYPE.SECRETS,
    provider: (secretsProvider || projectProvider),
    region: (secretsRegion || projectRegion),
    name: `${projectName}-project-secrets-vault`,
  };

  return [
    ...providers,
    ...cloudServices,
    state,
    secrets,
  ];
};

/**
 * Populates the project schema
 *
 * @param {String} projectSchemaId the root (project) schema id
 * @returns {JsonSchema<Project>}
 */
export const getProjectSchema = (
  projectSchemaId: string = JSON_SCHEMA_ROOT,
): JsonSchema<Project> => {
  const providers = Registry.providers();
  const regions: [ProviderChoice, JsonSchema<string>][] = Array.from(
    Registry.regions.entries()
  ).map(([provider, regions]) => ([
    provider, getRegionsSchema(provider, Array.from(regions)),
  ]));

  return {
    $id: projectSchemaId,
    $schema: 'http://json-schema.org/draft-07/schema',
    type: 'object',
    properties: {
      name: {
        type: 'string',
        pattern: '[a-zA-Z0-9-_./]+',
        description: 'The name of the project in a URL-friendly format',
      },
      provider: {
        type: 'string',
        enum: providers,
        description: 'The default provider for your cloud services',
      },
      region: {
        type: 'string',
        description: 'The default region for the provider you have selected',
      },
      secrets: {
        type: 'object',
        description: 'How would you like your services secrets to be stored',
      },
      state: {
        type: 'object',
        description: 'Where would you like your Terraform state to be stored',
      },
      stages: {
        type: 'array',
        description: 'The deployment stages for your projects',
        errorMessage: 'The stages configuration is invalid',
        minItems: 1,
        items: {
          type: 'object',
          oneOf: [
            { required: ['name', 'services'] },
            { required: ['name', 'copy'] },
          ],
          properties: {
            name: {
              type: 'string',
              description: 'The name of the stage',
            },
            services: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: true,
                required: ['name', 'type'],
                properties: {
                  name: { type: 'string' },
                  type: { type: 'string' },
                  provider: { type: 'string' },
                },
              },
            },
            copy: {
              type: 'string',
              description: 'The name of the stage to copy configuration from',
            },
            skip: {
              type: 'array',
              items: { type: 'string' },
              description: 'The names of services to skip when copying the aforementioned stage',
            },
          },
        },
      },
    },
    required: ['name', 'provider', 'region', 'stages'],
    allOf: [
      ...Registry.items.map(service => (
        isCoreService(service.type)
          ? getCoreServiceConditional(service as CoreService)
          : getCloudServiceConditional(service as CloudService)
      )),
      ...regions.map(
        ([provider, schema]) => getRegionConditional(provider, schema),
      ),
    ],
    $defs: {
      ...fromPairs(Registry.items.map(service => [service.schemaId, service.schema])),
      ...fromPairs(regions.map(([_ig, schema]) => [schema.$id, schema])),
    },
    errorMessage: {
      _: 'The configuration for the project is invalid',
      type: 'The configuration should be an object',
      properties: {
        name: 'The name for the project only accepts characters, numbers, dashes, underscores, dots and forward slashes',
        provider: `The provider is not valid. Accepted options are ${providers.join(', ')}`,
      },
      required: {
        name: 'You need to set a name for the project',
        provider: 'You need to set a default provider for the project',
        region: 'You need to set a default region for the project',
        stages: 'You should define at least one stage to deploy',
      },
    },
  };
};

/**
 * Replaces the state of the project with a local one
 *
 * @returns {Function<ServiceConfiguration[]>} the services
 */
export const withLocalState = (): (services: ServiceConfiguration[]) => ServiceConfiguration[] => (services) => {
  return services.map(
    srv => (srv.type === SERVICE_TYPE.STATE ? { ...srv, provider: PROVIDER.LOCAL } : srv),
  );
};
