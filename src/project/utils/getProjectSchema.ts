import { PROVIDER, SERVICE_TYPE } from '@src/constants'
import { DEFAULT_REGION, ENVIRONMENT } from '@src/project/constants'
import { fromPairs, groupBy, merge, omit, toPairs, without } from 'lodash'
import { JSON_SCHEMA_DRAFT } from '@src/validation/constants'
import { getServicesSchema } from '@src/validation/utils/getServicesSchema'
import type { ServiceConfiguration } from '@src/services/registry'
import type { ServiceTypeChoice } from '@src/services/types'
import type { ProjectConfiguration } from '@src/project/types'
import type { JsonSchema } from '@src/lib/schema'

const isSchemaOf = (schema: JsonSchema<any>, ...types: ServiceTypeChoice[]): boolean =>
  types.includes(schema.properties?.type?.const)

export const getProjectSchema = (): JsonSchema<ProjectConfiguration> => {
  const { $defs: serviceDefs = {} } = getServicesSchema()
  const providers = without(Object.values(PROVIDER), PROVIDER.LOCAL)

  // The provider, region and service name are implied in this version of the schema
  const serviceDefinitions: Record<string, JsonSchema<ServiceConfiguration>> = fromPairs(
    Object.entries(serviceDefs).map(([serviceRef, definition]) => {
      const impliedKeys = ['provider', 'region', 'name']

      // The type is also implied for the state service
      if (isSchemaOf(definition, SERVICE_TYPE.STATE, SERVICE_TYPE.PROVIDER)) {
        impliedKeys.push('type')
      }

      return [
        serviceRef,
        merge({}, omit(definition, 'required'), {
          ...definition,
          required: without(definition.required || [], ...impliedKeys),
          properties: {
            provider: { default: definition.properties.provider.const },
            type: { default: definition.properties.type.const },
          },
        }),
      ]
    }),
  )

  const stateServices = Object.values(serviceDefinitions).filter((schema) =>
    isSchemaOf(schema, SERVICE_TYPE.STATE),
  )

  const stateDiscriminations = stateServices.map((stateSchema) => ({
    if: {
      properties: { provider: { const: stateSchema.properties?.provider?.const } },
    },
    then: {
      $ref: `#/$defs/${stateSchema.$id}`,
    },
  }))

  const environmentServices = Object.values(serviceDefinitions).filter(
    (schema) => !isSchemaOf(schema, SERVICE_TYPE.STATE, SERVICE_TYPE.PROVIDER),
  )

  const serviceDiscriminations = toPairs(
    groupBy(environmentServices, (schema) => schema.properties?.type?.const),
  ).map(([type, services]) => ({
    if: {
      properties: {
        type: { const: type },
      },
    },
    then: {
      oneOf: services.map((schema) => ({ $ref: `#/$defs/${schema.$id}` })),
    },
  }))

  return {
    $id: 'stackmate',
    $schema: JSON_SCHEMA_DRAFT,
    type: 'object',
    required: ['state', 'environments'],
    properties: {
      provider: {
        type: 'string',
        enum: providers,
        default: PROVIDER.AWS,
      },
      region: {
        type: 'string',
        default: DEFAULT_REGION[PROVIDER.AWS],
      },
      state: {
        if: {
          required: ['provider'],
        },
        then: {
          allOf: stateDiscriminations,
        },
        else: {
          oneOf: stateServices.map((schema) => ({ $ref: `#/$defs/${schema.$id}` })),
        },
      },
      environments: {
        required: [ENVIRONMENT.PRODUCTION],
        patternProperties: {
          [`^${Object.values(ENVIRONMENT).join('|')}$`]: {
            type: 'object',
            uniqueAppDomains: true,
            patternProperties: {
              '^[a-zA-Z0-9_-]+$': {
                allOf: serviceDiscriminations,
              },
            },
          },
        },
      },
    },
    $defs: serviceDefinitions,
  }
}
