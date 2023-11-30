import { fromPairs } from 'lodash'
import { Registry, type ServiceAttributes } from '@services/registry'
import type { BaseServiceAttributes } from '@services/types'
import type { Dictionary } from 'lodash'
import type { JsonSchema } from '@lib/schema'
import { getServiceNameSchema } from './getServiceNameSchema'
import { JSON_SCHEMA_DRAFT } from '../constants'

export const getServicesSchema = (): JsonSchema<ServiceAttributes[]> => {
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
    $id: 'stackmate/services',
    $schema: JSON_SCHEMA_DRAFT,
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
        name: getServiceNameSchema(),
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
