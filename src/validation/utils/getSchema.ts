import { fromPairs } from 'lodash'
import { Registry, type ServiceAttributes } from '@services/registry'
import type { BaseServiceAttributes } from '@services/types'
import type { Dictionary } from 'lodash'
import type { JsonSchema } from '@lib/schema'
import { getNameSchema } from './getNameSchema'

/**
 * Populates the project schema
 *
 * @returns {JsonSchema<ServiceAttributes[]>}
 */

export const getSchema = (): JsonSchema<ServiceAttributes[]> => {
  const services = Registry.all()

  const allOf = services.map((service) => ({
    if: {
      properties: {
        provider: { const: service.provider },
        type: { const: service.type },
      },
    },
    then: {
      $ref: service.schemaId,
    },
  }))

  const $defs: Dictionary<JsonSchema<BaseServiceAttributes>> = fromPairs(
    services.map((service) => [service.schemaId, service.schema]),
  )

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
      required: ['name', 'type', 'provider'],
      properties: {
        name: getNameSchema(),
        type: {
          type: 'string',
          enum: Registry.types(),
        },
        provider: {
          type: 'string',
          enum: Registry.providers(),
        },
      },
      allOf,
      errorMessage: {
        required: {
          name: 'Every service should feature a "name" property',
          type: 'Every service should feature a "type" property',
          provider: 'Every service should feature a "provider" property',
        },
      },
    },
    $defs,
  }
}
