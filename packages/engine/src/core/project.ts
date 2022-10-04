import { defaults, fromPairs, isEmpty, uniqBy } from 'lodash';

import { JSON_SCHEMA_ROOT, PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';
import {
  CloudServiceAttributes, Registry, CloudServiceProvider,
  SecretVaultServiceAttributes, StateServiceAttributes,
} from '@stackmate/engine/core/registry';
import {
  BaseServiceAttributes, isCloudProvider, isCoreService, ProviderChoice,
} from '@stackmate/engine/core/service';
import {
  DistributiveOmit, DistributiveOptionalKeys, DistributivePartial,
  DistributiveRequireKeys, OneOfType,
} from '@stackmate/engine/lib';
import {
  getCloudServiceConditional, getCoreServiceConditional,
  getRegionConditional, getRegionsSchema, JsonSchema,
} from '@stackmate/engine/core/schema';

type CopiedStage = {
  name: string;
  copy?: string;
  skip?: string[];
};
export type CloudServiceConfiguration<IsPartial extends boolean = false> = IsPartial extends true
  ? DistributiveRequireKeys<DistributivePartial<CloudServiceAttributes>, 'name' | 'type'>
  : CloudServiceAttributes;

type StageWithServices<IsPartial extends boolean = false> = {
  name: string;
  services?: CloudServiceConfiguration<IsPartial>[];
};

/**
 * @type {StageConfiguration} the configuration for the project stages
 */
export type StageConfiguration<IsPartial extends boolean = false> = OneOfType<[
  CopiedStage,
  StageWithServices<IsPartial>,
]>;

/**
 * @type {Project} a project object
 */
export type Project = {
  name: string;
  provider: CloudServiceProvider;
  region: string;
  stages: StageConfiguration[];
  state: StateServiceAttributes;
  secrets: SecretVaultServiceAttributes;
};

/**
 * @type {ProjectConfiguration} the configuration object that creates a project
 */
export type ProjectConfiguration = Omit<Partial<Project>, 'stages' | 'state' | 'secrets'> & {
  state?: DistributiveOmit<DistributiveOptionalKeys<StateServiceAttributes, 'region'>, 'name' | 'type'>;
  secrets?: DistributiveOmit<DistributiveOptionalKeys<SecretVaultServiceAttributes, 'region'>, 'name' | 'type'>;
  stages?: StageConfiguration<true>[];
};

/**
 * Returns the list of the cloud services that are managed by the given stage
 *
 * @param {Project} config the configuration object
 * @param {String} stage the stage to get
 * @param {String[]} skippedServices any names of services to skip (when copying the stage)
 * @returns {BaseServiceAttributes[]} the cloud services deployed by this stage
 */
export const getCloudServices = (
  config: Project, stage: string, skippedServices: string[] = [],
): BaseServiceAttributes[] => {
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
    provider: projectProvider,
    region: projectRegion,
  }));
};

/**
 * Returns the configuration for the provider services, given a list of cloud services
 * We basically extract provider and region from the service list and return relevant configs
 *
 * @param {BaseServiceAttributes[]} services the services to get the provider configurations by
 * @returns {BaseServiceAttributes[]} the provider configurations
 */
export const getProviderConfigurations = (
  services: BaseServiceAttributes[],
): BaseServiceAttributes[] => {
  const providers = services.map(({ provider, region }) => {
    const identifier = [provider, 'provider', (region || 'default')].join('-');
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
 * @returns {Function<BaseServiceAttributes[]>} the configurations for the services to deploy
 */
export const getServiceConfigurations = (
  stage: string,
): (config: Project) => BaseServiceAttributes[] => (config) => {
  const {
    provider: projectProvider,
    region: projectRegion,
    name: projectName,
    state = {},
    secrets = {},
  } = config;

  if (!projectProvider) {
    throw new Error('There is no provider set for the project');
  }

  const cloudServices = getCloudServices(config, stage);
  const providers = getProviderConfigurations(cloudServices);

  // Predefined / core services => state & secrets
  const stateConfig = defaults({ ...state }, {
    name: `${projectName}-project-state`,
    type: SERVICE_TYPE.STATE,
    provider: projectProvider,
    region: projectRegion,
  });

  const secretsConfig = defaults({ ...secrets }, {
    name: `${projectName}-project-secrets-vault`,
    type: SERVICE_TYPE.SECRETS,
    provider: projectProvider,
    region: projectRegion,
  });

  return [
    ...providers,
    ...cloudServices,
    stateConfig,
    secretsConfig,
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
  const serviceTypes = Registry.serviceTypes();

  const cloudProviders = providers.filter(p => isCloudProvider(p));
  const stateProviders = Registry.providers('state');
  const secretsProviders = Registry.providers('secrets');

  const regions: [ProviderChoice, JsonSchema<string>][] = Array.from(
    Registry.regions.entries()
  ).filter(([_, regions]) => !isEmpty(regions)).map(([provider, regions]) => ([
    provider, getRegionsSchema(provider, Array.from(regions)),
  ]));

  return {
    $id: projectSchemaId,
    $schema: 'http://json-schema.org/draft-07/schema',
    type: 'object',
    properties: {
      name: {
        type: 'string',
        pattern: '^([a-zA-Z0-9-_./]+)$',
        minLength: 3,
        description: 'The name of the project in a URL-friendly format',
        errorMessage: {
          minLength: 'The "name" property should be more than 3 characters',
          pattern: 'The "name" property should consist of letters, numbers, dashes, dots, underscores and forward slashes',
        },
      },
      provider: {
        type: 'string',
        enum: cloudProviders,
        description: 'The default provider for your cloud services',
        errorMessage: {
          enum: `The provider is invalid, available choices are: ${cloudProviders.join(', ')}`,
        },
      },
      region: {
        type: 'string',
        description: 'The default region for the provider you have selected',
      },
      secrets: {
        type: 'object',
        description: 'How would you like your services secrets to be stored',
        properties: {
          provider: {
            type: 'string',
            enum: secretsProviders,
            description: 'The secrets provider',
            errorMessage: {
              enum: `Invalid secrets provider, available options are: ${secretsProviders.join(', ')}`,
            },
          },
        },
      },
      state: {
        type: 'object',
        description: 'Where would you like your Terraform state to be stored',
        properties: {
          provider: {
            type: 'string',
            enum: stateProviders,
            description: 'The state provider',
            errorMessage: {
              enum: `Invalid state provider, available options are: ${stateProviders.join(', ')}`,
            },
          },
        },
      },
      stages: {
        type: 'array',
        description: 'The deployment stages for your projects',
        minItems: 1,
        errorMessage: {
          minItems: 'You should define at least one stage',
        },
        items: {
          type: 'object',
          required: ['name'],
          oneOf: [
            {
              required: ['name', 'services'],
              errorMessage: {
                required: 'You should define at least one service or a source stage to copy from',
              },
            },
            {
              required: ['name', 'copy'],
              errorMessage: {
                required: 'You should define at least one service or a source stage to copy from',
              },
            },
          ],
          errorMessage: {
            oneOf: 'You should define at least one service or a source stage to copy from',
            required: {
              name: 'You should define a name for the stage',
            },
          },
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
                minItems: 1,
                properties: {
                  name: {
                    type: 'string',
                    pattern: '^([a-zA-Z0-9_-]+)$',
                    minLength: 2,
                    description: 'The name for the service',
                    errorMessage: {
                      minLength: 'The service’s name should be two characters or more',
                      pattern: 'The name property on the service should only contain characters, numbers, dashes and underscores',
                    },
                  },
                  type: {
                    type: 'string',
                    enum: serviceTypes,
                    errorMessage: {
                      enum: `You have to specify a valid service type, available are: ${serviceTypes.join(', ')}`
                    },
                  },
                  provider: {
                    type: 'string',
                    enum: providers,
                    errorMessage: {
                      enum: `You have to specify a valid provider, available are: ${providers.join(', ')}`,
                    },
                  },
                },
                errorMessage: {
                  required: {
                    name: 'Every service should feature a "name" property',
                    type: 'Every service should feature a "type" property',
                  },
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
          ? getCoreServiceConditional(service)
          : getCloudServiceConditional(service)
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
      type: 'The project configuration must be an object',
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
 * @returns {Function<BaseServiceAttributes[]>} the services
 */
export const withLocalState = (): (
  services: BaseServiceAttributes[],
) => BaseServiceAttributes[] => (services) => ([
  { name: 'local-state', type: SERVICE_TYPE.STATE, provider: PROVIDER.LOCAL },
  { name: 'local-provider', type: SERVICE_TYPE.PROVIDER, provider: PROVIDER.LOCAL },
  ...services,
]);
