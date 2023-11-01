import { defaults, fromPairs, groupBy, isEmpty, uniq } from 'lodash'

import { CLOUD_PROVIDER, JSON_SCHEMA_ROOT, SERVICE_TYPE } from '@constants'
import type {
  CloudServiceAttributes,
  CloudServiceProvider,
  SecretVaultServiceAttributes,
  StateServiceAttributes,
} from '@core/registry'
import { Registry } from '@core/registry'
import type {
  BaseServiceAttributes,
  ProviderChoice,
  ServiceTypeChoice,
  BaseService,
  MonitoringAttributes,
} from '@core/service'
import {
  getServiceProviderSchema,
  getServiceNameSchema,
  getServiceTypeSchema,
  isCoreService,
  getMonitoringSchema,
} from '@core/service'
import type {
  DistributiveOmit,
  DistributiveOptionalKeys,
  DistributivePartial,
  DistributiveRequireKeys,
  OptionalKeys,
} from '@lib/util'
import type { JsonSchema } from '@core/schema'
import { getProviderServiceSchemas, getRegionConditional, getRegionsSchema } from '@core/schema'

/**
 * @type {CloudServiceConfiguration} describes the cloud service configuration
 */
export type CloudServiceConfiguration = DistributiveRequireKeys<
  DistributivePartial<CloudServiceAttributes>,
  'name' | 'type'
>

/**
 * @type {Project} a project object
 */
export type Project = {
  name: string
  provider: CloudServiceProvider
  region: string
  services: CloudServiceAttributes[]
  state: StateServiceAttributes
  secrets: SecretVaultServiceAttributes
  monitoring: Partial<MonitoringAttributes['monitoring']>
}

/**
 * @type {ProjectConfiguration} the configuration object that creates a project
 */
export type ProjectConfiguration = Partial<Omit<Project, 'services' | 'state' | 'secrets'>> & {
  services?: CloudServiceConfiguration[]
  state?: DistributiveOmit<
    DistributiveOptionalKeys<StateServiceAttributes, 'region'>,
    'name' | 'type'
  >
  secrets?: DistributiveOmit<
    DistributiveOptionalKeys<SecretVaultServiceAttributes, 'region'>,
    'name' | 'type'
  >
}

/**
 * @param {Object} config the service's configuration
 * @param {Project} project the project to use
 * @returns {BaseServiceAttributes} the configuration with credentials applied
 */
const applyProjectDefaults = (
  config: OptionalKeys<BaseServiceAttributes, 'name' | 'provider' | 'region'>,
  project: Project,
): BaseServiceAttributes => {
  const cfg = defaults({}, config, {
    name: `${config.type}-service`,
    provider: project.provider,
  })

  if (cfg.provider === project.provider) {
    Object.assign(cfg, { region: project.region })
  }

  return cfg
}

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
  const regionsPerProvider = new Map()

  Object.entries(groupBy(services, 'provider')).forEach(([provider, configs]) => {
    const regions: string[] = configs.map((cfg) => cfg.region).filter((r) => Boolean(r)) as string[]
    regionsPerProvider.set(provider, new Set(regions))
  })

  return regionsPerProvider
}

/**
 * Expands a core service to all regions available in the project
 *
 * @param {BaseServiceAttributes} config the service's configuration
 * @param {Set<String>} regions the regions available for the service
 * @returns {BaseServiceAttributes} the expanded core service configurations
 */
export const expandCoreService = (
  config: BaseServiceAttributes,
  regions?: Set<string>,
): BaseServiceAttributes[] => {
  const { type, provider, name } = config

  if (!isCoreService(type)) {
    throw new Error('Only core services can be expanded')
  }

  if (!regions || !regions.size) {
    return []
  }

  const service = Registry.get(provider, type)
  const isExpandable = Array.isArray(service.regions) && !isEmpty(service.regions)

  if (!isExpandable) {
    return [config]
  }

  return uniq(Array.from(regions)).map((region) => ({
    ...config,
    region,
    name: `${name}-${region}`,
  }))
}

export const getCoreServiceConfigurations = (
  initialConfiguration: BaseServiceAttributes | null,
  type: ServiceTypeChoice,
  services: BaseServiceAttributes[],
): BaseServiceAttributes[] => {
  // The provider => regions mapping for the given service
  const providersPerRegion = getRegionsPerProvider(services)
  // The providers available in the configuration
  const providers = Array.from(providersPerRegion.keys())
  // The providers covered by the current or generated configuration
  const providersCovered: Set<ProviderChoice> = new Set()
  const configs: BaseServiceAttributes[] = []

  // Check the initial configuration. If it covers all providers, there's nothing else to do
  if (initialConfiguration) {
    providersCovered.add(initialConfiguration.provider)
    configs.push(initialConfiguration)

    if (providers.every((provider) => providersCovered.has(provider))) {
      return configs
    }
  }

  // Alright, the initial configuration doesn't cover all providers, where's what we need to do:
  // For every provider that is NOT covered, check the following:
  const remainingProviders = providers.filter((prov) => !providersCovered.has(prov))
  remainingProviders.forEach((provider) => {
    // If the provider is supported by the configuration provided so far, there's nothing to do
    if (providersCovered.has(provider)) {
      return
    }

    let service: BaseService | undefined
    try {
      // does the provider have a dedicated service? If so, use that
      service = Registry.get(provider, type)
    } catch (err) {
      // if not, use one that does from the list of available services for the type specified
      service = Registry.ofType(type).find((service) => service.provider === provider)
    }

    if (!service) {
      return
    }

    const configuration = {
      ...(initialConfiguration || {}),
      type,
      provider,
      name: `${provider}-${type}-service`,
    }

    configs.push(...expandCoreService(configuration, providersPerRegion.get(provider) || new Set()))
  })

  // Finally, assert that all providers are covered by the set of core services & return
  return configs
}

/**
 * Returns the service configurations for the project
 *
 * @param {Project} project the configuration for the project
 * @returns {Function<BaseServiceAttributes[]>} the configurations for the services to deploy
 */
export const getProjectServices = (project: Project): BaseServiceAttributes[] => {
  const coreServices: BaseServiceAttributes[] = []
  const { provider, state, secrets, services } = project
  const cloudServices = services.map((service) => applyProjectDefaults(service, project))

  if (isEmpty(cloudServices)) {
    throw new Error('No services were found in this project')
  }

  const initialCoreConfigs: [ServiceTypeChoice, BaseServiceAttributes | null][] = [
    [
      SERVICE_TYPE.PROVIDER,
      applyProjectDefaults(
        {
          type: SERVICE_TYPE.PROVIDER,
          name: `${provider}-provider-service`,
        },
        project,
      ),
    ],
    [
      SERVICE_TYPE.STATE,
      !isEmpty(state)
        ? applyProjectDefaults({ ...state, type: SERVICE_TYPE.STATE }, project)
        : null,
    ],
    [
      SERVICE_TYPE.SECRETS,
      !isEmpty(secrets)
        ? applyProjectDefaults({ ...secrets, type: SERVICE_TYPE.SECRETS }, project)
        : null,
    ],
  ]

  initialCoreConfigs.forEach(([type, initialConfig]) => {
    coreServices.push(...getCoreServiceConfigurations(initialConfig, type, cloudServices))
  })

  return [...cloudServices, ...coreServices]
}

/**
 * Populates the project schema
 *
 * @param {String} projectSchemaId the root (project) schema id
 * @returns {JsonSchema<Project>}
 */
export const getProjectSchema = (
  projectSchemaId: string = JSON_SCHEMA_ROOT,
): JsonSchema<Project> => {
  const providers = Registry.providers()
  const cloudProviders = Object.values(CLOUD_PROVIDER)
  const regions: [ProviderChoice, JsonSchema<string>][] = Array.from(Registry.regions.entries())
    .filter(([_, regions]) => !isEmpty(regions))
    .map(([provider, regions]) => [provider, getRegionsSchema(provider, Array.from(regions))])

  const allOf: JsonSchema[] = [
    ...regions.map(([provider, schema]) => getRegionConditional(provider, schema)),
  ]

  const $defs = {
    ...fromPairs(Registry.items.map((service) => [service.schemaId, service.schema])),
    ...fromPairs(regions.map(([_ig, schema]) => [schema.$id, schema])),
  }

  const {
    properties: { monitoring },
  } = getMonitoringSchema()

  // Add type discriminations for the cloud providers available
  providers.forEach((provider) => {
    getProviderServiceSchemas(provider, Registry.ofProvider(provider)).forEach((schema) => {
      const { $id: schemaId } = schema

      Object.assign($defs, { [schemaId]: schema })
      allOf.push({ $ref: schemaId })
    })
  })

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
          pattern:
            'The "name" property should consist of letters, numbers, dashes, dots, underscores and forward slashes',
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
      services: {
        type: 'array',
        minItems: 1,
        uniqueItems: true,
        errorMessage: {
          minItems: 'You should define at least one service to deploy',
        },
        items: {
          type: 'object',
          additionalProperties: true,
          required: ['name', 'type'],
          properties: {
            name: getServiceNameSchema(),
            type: getServiceTypeSchema(Registry.serviceTypes()),
            provider: getServiceProviderSchema(providers),
          },
          errorMessage: {
            required: {
              name: 'Every service should feature a "name" property',
              type: 'Every service should feature a "type" property',
            },
          },
        },
      },
    },
    allOf,
    $defs,
    required: ['name', 'provider', 'region', 'services'],
    errorMessage: {
      type: 'The project configuration must be an object',
      required: {
        name: 'You need to set a name for the project',
        provider: 'You need to set a default provider for the project',
        region: 'You need to set a default region for the project',
        services: 'You should define at least one service',
      },
    },
  }
}
