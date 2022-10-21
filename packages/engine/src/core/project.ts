import { defaults, fromPairs, isEmpty, uniqBy } from 'lodash';

import { JSON_SCHEMA_ROOT, PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';
import {
  CloudServiceAttributes, Registry, CloudServiceProvider,
  SecretVaultServiceAttributes, StateServiceAttributes, MonitoringServiceAttributes,
} from '@stackmate/engine/core/registry';
import {
  BaseServiceAttributes, getServiceProviderSchema, getServiceNameSchema, getServiceTypeSchema,
  isCloudProvider, isCoreService, ProviderChoice,
} from '@stackmate/engine/core/service';
import {
  DistributiveOmit, DistributiveOptionalKeys, DistributivePartial,
  DistributiveRequireKeys, OneOfType, OptionalKeys,
} from '@stackmate/engine/lib';
import {
  getCloudServiceConditional, getCoreServiceConditional,
  getRegionConditional, getRegionsSchema, JsonSchema,
} from '@stackmate/engine/core/schema';

/**
 * @type {CopiedStage} a stage which is a copy of another one
 */
type CopiedStage = {
  copy?: string;
  skip?: string[];
};

/**
 * @type {StageWithServices} a stage that is not coppied, rather has services configured
 */
type StageWithServices<IsPartial extends boolean = false> = {
  services?: CloudServiceConfiguration<IsPartial>[];
};

/**
 * @type {CloudServiceConfiguration} describes the cloud service configuration
 */
export type CloudServiceConfiguration<IsPartial extends boolean = false> = IsPartial extends true
  ? DistributiveRequireKeys<DistributivePartial<CloudServiceAttributes>, 'name' | 'type'>
  : CloudServiceAttributes;

/**
 * @type {StageConfiguration} the configuration for the project stages
 */
export type StageConfiguration<IsPartial extends boolean = false> = OneOfType<[
  CopiedStage,
  StageWithServices<IsPartial>,
]> & {
  name: string;
  alerts?: DistributiveOmit<DistributivePartial<MonitoringServiceAttributes>, 'name' | 'type'>;
};

/**
 * @type {TransformableConfiguration} the service's configuration
 */
export type TransformableConfiguration = OptionalKeys<
  BaseServiceAttributes, 'name' | 'provider' | 'region'
>;

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
  stages?: StageConfiguration<true>[];
  state?: DistributiveOmit<
    DistributiveOptionalKeys<StateServiceAttributes, 'region'>, 'name' | 'type'
  >;
  secrets?: DistributiveOmit<
    DistributiveOptionalKeys<SecretVaultServiceAttributes, 'region'>, 'name' | 'type'
  >;
};

/**
 * @param {Project} project the project's configuration
 * @param {String} stageName the name of the stage to get
 * @returns {StageConfiguration} the stage's configuration
 * @throws {Error} when the stage is not available in the project
 */
export const getStage = (project: Project, stageName: string): StageConfiguration => {
  const { stages = [] } = project;

  if (isEmpty(stages)) {
    throw new Error('There aren’t any stages defined for the project');
  }

  const stage = stages.find(s => s.name === stageName);

  if (!stage) {
    throw new Error(`Stage ${stageName} is not available in the project`);
  }

  return stage;
};

/**
 * @param {TransformableConfiguration} config the service's configuration
 * @param {Project} project the project to use
 * @returns {BaseServiceAttributes} the configuration with credentials applied
 */
const applyProjectDefaults = (
  config: TransformableConfiguration, project: Project,
): BaseServiceAttributes => {
  const cfg = defaults({}, config, {
    name: `${config.type}-service`,
    provider: project.provider,
  });

  if (cfg.provider === project.provider) {
    Object.assign(cfg, { region: project.region });
  }

  return cfg;
};

/**
 * Returns the list of the cloud services that are managed by the given stage
 *
 * @param {Project} project the configuration object
 * @param {String} stage the stage to get
 * @param {String[]} skippedServices any names of services to skip (when copying the stage)
 * @returns {BaseServiceAttributes[]} the cloud services deployed by this stage
 */
export const getCloudServices = (
  project: Project, stage: string, skippedServices: string[] = [],
): BaseServiceAttributes[] => {
  const { copy: copyFrom = null, skip = [], services: stageServices = [] } = getStage(
    project, stage,
  );

  if (isEmpty(stageServices) && !copyFrom) {
    throw new Error(
      `Stage ${stage} is improperly configured. It doesn't provide any services or stage to copy from`,
    );
  }

  const services = [];

  if (copyFrom) {
    services.push(...getCloudServices(project, copyFrom, skip));
  }

  services.push(...stageServices.filter(srv => !skippedServices.includes(srv.name)));

  return services;
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
 * @param {String} stageName the name of the stage to get configurations for
 * @returns {Function<BaseServiceAttributes[]>} the configurations for the services to deploy
 */
export const getServiceConfigurations = (
  stageName: string,
): (project: Project) => BaseServiceAttributes[] => (project) => {
  const cloudServices = getCloudServices(project, stageName);
  const { alerts } = getStage(project, stageName);
  const { state, secrets } = project;

  if (isEmpty(cloudServices)) {
    throw new Error(`There are no services defined for stage ${stageName}`);
  }

  // Predefined / core services => providers, state, monitoring & secrets
  const providerConfigurations = getProviderConfigurations(cloudServices);
  const coreServices: TransformableConfiguration[] = [
    { ...state, type: SERVICE_TYPE.STATE },
    { ...secrets, type: SERVICE_TYPE.SECRETS },
    ...providerConfigurations,
  ];

  providerConfigurations.forEach(({ provider, region }) => {
    coreServices.push({ ...alerts, provider, region, type: SERVICE_TYPE.MONITORING });
  });

  return [...cloudServices, ...coreServices].map(
    (cfg) => applyProjectDefaults(cfg, project),
  );
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
  const stateProviders = Registry.providers(SERVICE_TYPE.STATE);
  const secretsProviders = Registry.providers(SERVICE_TYPE.SECRETS);
  const monitoringProviders = Registry.providers(SERVICE_TYPE.MONITORING);
  const allServices = Registry.items;
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
      provider: getServiceProviderSchema(cloudProviders),
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
      region: {
        type: 'string',
        description: 'The default region for the provider you have selected',
      },
      secrets: {
        type: 'object',
        description: 'How would you like your services secrets to be stored',
        properties: {
          provider: getServiceProviderSchema(secretsProviders),
        },
      },
      state: {
        type: 'object',
        description: 'Where would you like your Terraform state to be stored',
        properties: {
          provider: getServiceProviderSchema(stateProviders),
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
              pattern: '^([a-zA-Z0-9_-]+)$',
              description: 'The name of the stage',
              errorMessage: {
                pattern: 'The stage name should only contain characters, numbers, dashes and underscores',
              },
            },
            alerts: {
              type: 'object',
              default: {},
              properties: {
                provider: getServiceProviderSchema(monitoringProviders),
                emails: {
                  type: 'array',
                  minItems: 1,
                  description: 'The list of email addresses to send the alerts to',
                  items: {
                    type: 'string',
                    format: 'email',
                    errorMessage: {
                      format: '{/email} is not a valid email address',
                    },
                  },
                  errorMessage: {
                    minItems: 'You have to provide at least one email address to alert',
                  },
                },
              },
            },
            services: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: true,
                required: ['name', 'type'],
                minItems: 1,
                properties: {
                  name: getServiceNameSchema(),
                  provider: getServiceProviderSchema(providers),
                  type: getServiceTypeSchema(serviceTypes),
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
      // We need to exclude 'provider' services from the conditionals, since it will try
      // to register a 'provider' attribute which conflicts with the main `provider` one
      ...allServices.filter(
        service => service.type !== SERVICE_TYPE.PROVIDER,
      ).map(service => (
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
