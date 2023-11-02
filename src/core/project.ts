import { fromPairs, isEmpty } from 'lodash'
import { Registry } from '@core/registry'
import { getProviderServiceSchemas, getRegionConditional, getRegionsSchema } from '@core/schema'
import { getServiceProviderSchema, getServiceNameSchema, getServiceTypeSchema } from '@core/service'
import { hashObject } from '@lib/hash'
import { getValidData } from '@core/validation'
import type { JsonSchema } from '@core/schema'
import type { ServiceAttributes, ServiceConfiguration } from '@core/registry'
import type { ProviderChoice, BaseProvisionable } from '@core/service'

export type ProvisionablesMap = Map<BaseProvisionable['id'], BaseProvisionable>

/**
 * Populates the project schema
 *
 * @returns {JsonSchema<ServiceAttributes[]>}
 */
export const getProjectSchema = (): JsonSchema<ServiceAttributes[]> => {
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

  // Add type discriminations for the cloud providers available
  const providers = Registry.providers()
  providers.forEach((provider) => {
    getProviderServiceSchemas(provider, Registry.ofProvider(provider)).forEach((schema) => {
      const { $id: schemaId } = schema

      Object.assign($defs, { [schemaId]: schema })
      allOf.push({ $ref: schemaId })
    })
  })

  return {
    $id: 'stackmate-services-configuration',
    $schema: 'http://json-schema.org/draft-07/schema',
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
    allOf,
    $defs,
  }
}

/**
 * Gets a provisionable based on a service's attributes
 *
 * @param {BaseServiceAttributes} config the service's configuration
 * @returns {BaseProvisionable} the provisionable to use in operations
 */
export const getProvisionable = (config: ServiceAttributes): BaseProvisionable => {
  const { name, type, provider, region } = config
  const resourceId = `${name || type}-${provider}-${region || 'default'}`

  return {
    id: hashObject(config),
    config,
    service: Registry.fromConfig(config),
    requirements: {},
    provisions: {},
    sideEffects: {},
    registered: false,
    resourceId: resourceId,
  }
}

/**
 * Maps a list of service configurations to provisionables
 *
 * @param {ServiceConfiguration[]} configs the services configurations
 * @returns {ProvisionablesMap}
 */
export const getProvisionables = (configs: ServiceConfiguration[]): ProvisionablesMap => {
  const provisionables: ProvisionablesMap = new Map()

  // Get services validated and apply default values
  const serviceAttributes = getValidData<ServiceConfiguration[], ServiceAttributes[]>(
    configs,
    getProjectSchema(),
  )

  serviceAttributes.forEach((config) => {
    const provisionable = getProvisionable(config)
    provisionables.set(provisionable.id, provisionable)
  })

  return provisionables
}
