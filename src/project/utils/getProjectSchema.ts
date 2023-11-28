import { PROVIDER } from '@src/constants'
import { DEFAULT_REGION, ENVIRONMENT } from '@src/project/constants'
import { fromPairs, merge, omit, without } from 'lodash'
import { JSON_SCHEMA_DRAFT } from '@src/validation/constants'
import { getServicesSchema } from '@src/validation/utils/getServicesSchema'
import type { ProjectConfiguration } from '@src/project/types'
import type { JsonSchema } from '@src/lib/schema'

export const getProjectSchema = (): JsonSchema<ProjectConfiguration> => {
  const { $defs: serviceDefs = {} } = getServicesSchema()
  const providers = without(Object.values(PROVIDER), PROVIDER.LOCAL)

  // The provider, region and service name are implied in this version of the schema
  const serviceDefinitions = fromPairs(
    Object.entries(serviceDefs).map(([serviceRef, definition]) => {
      const impliedKeys = ['provider', 'region', 'name']

      // The type is also implied for the state service
      if (serviceRef.endsWith('/state')) {
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

  const serviceDefinitionReferences = Object.keys(serviceDefinitions)
    .filter((schemaId) => !schemaId.endsWith('/state') && !schemaId.endsWith('/provider'))
    .map((schemaId) => ({ $ref: schemaId }))

  const stateServiceDefinitionReferences = Object.keys(serviceDefinitions)
    .filter((schemaId) => schemaId.endsWith('/state'))
    .map((schemaId) => ({ $ref: schemaId }))

  return {
    $id: 'stackmate/project',
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
      domains: {
        type: 'object',
        patternProperties: {
          [`^${Object.values(ENVIRONMENT).join('|')}$`]: {
            type: 'array',
            items: {
              type: 'string',
              minItems: 1,
            },
          },
        },
      },
      state: {
        oneOf: stateServiceDefinitionReferences,
      },
      environments: {
        required: [ENVIRONMENT.PRODUCTION],
        patternProperties: {
          [`^${Object.values(ENVIRONMENT).join('|')}$`]: {
            type: 'object',
            patternProperties: {
              '^[a-zA-Z0-9_-]+$': {
                anyOf: serviceDefinitionReferences,
              },
            },
          },
        },
      },
    },
    $defs: serviceDefinitions,
  }
}
