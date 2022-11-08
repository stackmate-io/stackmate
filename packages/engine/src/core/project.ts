import { defaults, fromPairs, groupBy, isEmpty, uniq } from 'lodash';
import { CLOUD_PROVIDER, JSON_SCHEMA_ROOT, PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';

import {
  CloudServiceAttributes, Registry, CloudServiceProvider,
  SecretVaultServiceAttributes, StateServiceAttributes,
} from '@stackmate/engine/core/registry';
import {
  BaseServiceAttributes, getServiceProviderSchema, getServiceNameSchema,
  getServiceTypeSchema, isCoreService, ProviderChoice,
  ServiceTypeChoice, BaseService, getMonitoringSchema, MonitoringAttributes,
} from '@stackmate/engine/core/service';
import {
  DistributiveOmit, DistributiveOptionalKeys, DistributivePartial,
  DistributiveRequireKeys, OneOfType, OptionalKeys,
} from '@stackmate/engine/lib';
import {
  getProviderServiceSchemas, getRegionConditional, getRegionsSchema, JsonSchema,
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
  monitoring: Partial<MonitoringAttributes['monitoring']>;
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

  return services.map((service) => applyProjectDefaults(service, project));
};

/**
 * Returns the list of regions available within a list of services for a given provider
 *
 * @param {ProviderChoice} provider the service's provider
 * @param {BaseServiceAttributes[]} services all available cloud services in the project
 * @returns {String[]} the list of regions
 */
export const getRegionsPerProvider = (
  services: BaseServiceAttributes[],
): Map<ProviderChoice, Set<string>> => {
  const regionsPerProvider = new Map();

  Object.entries(groupBy(services, 'provider')).forEach(([provider, configs]) => {
    const regions: string[] = configs.map(cfg => cfg.region).filter((r) => Boolean(r)) as string[];
    regionsPerProvider.set(provider, new Set(regions));
  });

  return regionsPerProvider;
};

/**
 * Expands a core service to all regions available in the project
 *
 * @param {BaseServiceAttributes} config the service's configuration
 * @param {Set<String>} regions the regions available for the service
 * @returns {BaseServiceAttributes} the expanded core service configurations
 */
export const expandCoreService = (
  config: BaseServiceAttributes, regions?: Set<string>,
): BaseServiceAttributes[] => {
  const { type, provider, name } = config;

  if (!isCoreService(type)) {
    throw new Error('Only core services can be expanded');
  }

  if (!regions || !regions.size) {
    return [];
  }

  const service = Registry.get(provider, type);
  const isExpandable = Array.isArray(service.regions) && !isEmpty(service.regions);

  if (!isExpandable) {
    return [config];
  }

  return uniq(Array.from(regions)).map(
    (region) => ({ ...config, region, name: `${name}-${region}` }),
  );
};

export const getCoreServiceConfigurations = (
  initialConfiguration: BaseServiceAttributes | null,
  type: ServiceTypeChoice,
  services: BaseServiceAttributes[],
): BaseServiceAttributes[] => {
  // The provider => regions mapping for the given service
  const providersPerRegion = getRegionsPerProvider(services);
  // The providers available in the configuration
  const providers = Array.from(providersPerRegion.keys());
  // The providers covered by the current or generated configuration
  const providersCovered: Set<ProviderChoice> = new Set();
  const configs: BaseServiceAttributes[] = [];

  // Check the initial configuration. If it covers all providers, there's nothing else to do
  if (initialConfiguration) {
    providersCovered.add(initialConfiguration.provider);
    configs.push(initialConfiguration);

    if (providers.every((provider) => providersCovered.has(provider))) {
      return configs;
    }
  }

  // Alright, the initial configuration doesn't cover all providers, where's what we need to do:
  // For every provider that is NOT covered, check the following:
  const remainingProviders = providers.filter(prov => !providersCovered.has(prov));
  remainingProviders.forEach((provider) => {
    // If the provider is supported by the configuration provided so far, there's nothing to do
    if (providersCovered.has(provider)) {
      return;
    }

    let service: BaseService | undefined;
    try {
      // does the provider have a dedicated service? If so, use that
      service = Registry.get(provider, type);
    } catch (err) {
      // if not, use one that does from the list of available services for the type specified
      service = Registry.ofType(type).find((service) => service.provider === provider);
    }

    if (!service) {
      return;
    }

    const configuration = {
      ...(initialConfiguration || {}), type, provider, name: `${provider}-${type}-service`,
    };

    configs.push(
      ...expandCoreService(configuration, providersPerRegion.get(provider) || new Set()),
    );
  });

  // Finally, assert that all providers are covered by the set of core services & return
  return configs;
};

/**
 * Returns the service configurations for the project and stage
 *
 * @param {String} stage the name of the stage to get configurations for
 * @returns {Function<BaseServiceAttributes[]>} the configurations for the services to deploy
 */
export const getServiceConfigurations = (
  stage: string,
): (project: Project) => BaseServiceAttributes[] => (project) => {
  const cloudServices = getCloudServices(project, stage);
  const coreServices: BaseServiceAttributes[] = [];
  const { provider, state, secrets } = project;

  if (isEmpty(cloudServices)) {
    throw new Error(`There are no services defined for stage ${stage}`);
  }

  const initialCoreConfigs: [ServiceTypeChoice, BaseServiceAttributes | null][] = [
    [SERVICE_TYPE.PROVIDER, applyProjectDefaults({
      type: SERVICE_TYPE.PROVIDER, name: `${provider}-provider-service`}, project)],
    [SERVICE_TYPE.STATE, !isEmpty(state)
      ? applyProjectDefaults({ ...state, type: SERVICE_TYPE.STATE }, project)
      : null],
    [SERVICE_TYPE.SECRETS, !isEmpty(secrets)
      ? applyProjectDefaults({ ...secrets, type: SERVICE_TYPE.SECRETS }, project)
      : null],
  ];

  initialCoreConfigs.forEach(([type, initialConfig]) => {
    coreServices.push(...getCoreServiceConfigurations(initialConfig, type, cloudServices));
  });

  return [...cloudServices, ...coreServices];
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
  const cloudProviders = Object.values(CLOUD_PROVIDER);
  const regions: [ProviderChoice, JsonSchema<string>][] = Array.from(
    Registry.regions.entries()
  ).filter(([_, regions]) => !isEmpty(regions)).map(([provider, regions]) => ([
    provider, getRegionsSchema(provider, Array.from(regions)),
  ]));

  const allOf: JsonSchema[] = [
    ...regions.map(([provider, schema]) => getRegionConditional(provider, schema)),
  ];

  const $defs = {
    ...fromPairs(Registry.items.map(service => [service.schemaId, service.schema])),
    ...fromPairs(regions.map(([_ig, schema]) => [schema.$id, schema])),
  };

  const { properties: { monitoring } } = getMonitoringSchema();

  // Add type discriminations for the cloud providers available
  providers.forEach((provider) => {
    getProviderServiceSchemas(provider, Registry.ofProvider(provider)).forEach((schema) => {
      const { $id: schemaId } = schema;

      Object.assign($defs, { [schemaId]: schema });
      allOf.push({ $ref: schemaId });
    });
  });

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
      monitoring,
      secrets: {
        type: 'object',
        description: 'How would you like your services secrets to be stored',
        properties: {
          provider: getServiceProviderSchema(Registry.providers(SERVICE_TYPE.SECRETS)),
        },
      },
      state: {
        type: 'object',
        description: 'Where would you like your Terraform state to be stored',
        properties: {
          provider: getServiceProviderSchema(Registry.providers(SERVICE_TYPE.STATE)),
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
                  type: getServiceTypeSchema(Registry.serviceTypes()),
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
    allOf,
    $defs,
    required: ['name', 'provider', 'region', 'stages'],
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
