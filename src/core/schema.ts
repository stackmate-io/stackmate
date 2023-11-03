import { fromPairs, merge, uniq } from 'lodash'
import { Services } from '@core/registry'
import { getServiceProviderSchema, getServiceNameSchema, getServiceTypeSchema } from '@core/service'
import type { Dictionary } from 'lodash'
import type { ServiceAttributes } from '@core/registry'
import type { Obj, RequireKeys } from '@lib/util'
import type { BaseService } from '@core/service/core'

/**
 * @type {JsonSchema<T>} the JSON schema type
 */
export type JsonSchema<T = undefined> = {
  $id?: string
  $ref?: string

  ///////////////////////////////////////////////////////////////////////////
  // Schema Metadata
  ///////////////////////////////////////////////////////////////////////////
  /**
   * This is important because it tells refs where the root of the document is located
   */
  id?: string
  /**
   * It is recommended that the meta-schema is included
   * in the root of any json schema and must be a uri
   */
  $schema?: string
  /**
   * Title of the schema
   */
  title?: string
  /**
   * Constant value for a property or schema
   */
  const?: any
  /**
   * Schema description
   */
  description?: string
  /**
   * Default json for the object represented by this schema
   */
  default?: any

  ///////////////////////////////////////////////////////////////////////////
  // Number Validation
  ///////////////////////////////////////////////////////////////////////////
  /**
   * The value must be a multiple of the number (e.g. 10 is a multiple of 5)
   */
  multipleOf?: number
  maximum?: number
  /**
   * If true maximum must be > value, >= otherwise
   */
  exclusiveMaximum?: boolean
  minimum?: number
  /**
   * If true minimum must be < value, <= otherwise
   */
  exclusiveMinimum?: boolean

  ///////////////////////////////////////////////////////////////////////////
  // String Validation
  ///////////////////////////////////////////////////////////////////////////
  maxLength?: number
  minLength?: number
  /**
   * This is a regex string that the value must conform to
   */
  pattern?: string

  ///////////////////////////////////////////////////////////////////////////
  // Array Validation
  ///////////////////////////////////////////////////////////////////////////
  additionalItems?: boolean | JsonSchema
  items?: T extends ArrayLike<any> ? JsonSchema<T[keyof T]> : JsonSchema
  contains?: T extends ArrayLike<any> ? JsonSchema<T[keyof T]> : JsonSchema

  maxItems?: number
  minItems?: number
  uniqueItems?: boolean

  ///////////////////////////////////////////////////////////////////////////
  // Object Validation
  ///////////////////////////////////////////////////////////////////////////
  maxProperties?: number
  minProperties?: number
  required?: string[]
  additionalProperties?: boolean | JsonSchema
  /**
   * Holds simple JSON Schema definitions for referencing from elsewhere
   */
  $defs?: T extends ArrayLike<any>
    ? JsonSchema<T[number]>
    : T extends Obj
    ? { [K in keyof T]?: JsonSchema<T[K]> }
    : never

  definitions?: T extends ArrayLike<any>
    ? JsonSchema<T[number]>
    : T extends Obj
    ? { [K in keyof T]?: JsonSchema<T[K]> }
    : never

  /**
   * The keys that can exist on the object with the json schema that should validate their value
   */
  properties?: T extends Obj
    ? { [K in keyof T]?: JsonSchema<T[K]> }
    : { [property: string]: JsonSchema }

  /**
   * The key of this object is a regex for which properties the schema applies to
   */
  patternProperties?: T extends Obj ? { [pattern in keyof T]?: JsonSchema<T[pattern]> } : never

  /**
   * If the key is present as a property then the string of properties must also be present.
   * If the value is a JSON Schema then it must also be valid for the object if the key is present.
   */
  dependencies?: T extends Obj ? { [key in keyof T]?: JsonSchema<T[key]> | string[] } : never

  ///////////////////////////////////////////////////////////////////////////
  // Generic
  ///////////////////////////////////////////////////////////////////////////
  /**
   * Enumerates the values that this schema can be
   * (e.g. {"type": "string", "enum": ["red", "green", "blue"]})
   */
  enum?: any[] | readonly any[]
  /**
   * The basic type of this schema, can be one of
   * [string, number, object, array, boolean, null]
   * or an array of the acceptable types
   */
  type?: T extends undefined
    ? string // undefined, string TYPE by default
    : T extends number
    ? 'number'
    : T extends string
    ? 'string' | string // string type or some explicit string passed (eg. eu-central-1)
    : T extends boolean
    ? 'boolean'
    : T extends ArrayLike<any>
    ? 'array'
    : T extends null
    ? 'null'
    : T extends object
    ? 'object'
    : string // explicitly defined, string type

  format?: string

  ///////////////////////////////////////////////////////////////////////////
  // Combining Schemas
  ///////////////////////////////////////////////////////////////////////////
  allOf?: JsonSchema[]
  anyOf?: JsonSchema[]
  oneOf?: JsonSchema[]
  /**
   * The entity being validated must not match this schema
   */
  not?: JsonSchema
  if?: JsonSchema
  then?: JsonSchema
  else?: JsonSchema

  // Stackmate-specific
  isIpOrCidr?: boolean
  serviceLinks?: boolean
  serviceProfile?: boolean
  serviceProfileOverrides?: boolean

  // AJV-error specific
  errorMessage?:
    | string
    | {
        _?: string
        type?: string
        additionalProperties?: string

        // Error messages for when some conditions are not met
        oneOf?: string
        enum?: string
        pattern?: string
        format?: string
        multipleOf?: string
        maximum?: string
        exclusiveMaximum?: string
        minimum?: string
        exclusiveMinimum?: string
        maxItems?: string
        minItems?: string
        maxLength?: string
        minLength?: string

        properties?: { [property: string]: string } | string
        required?: { [property: string]: string } | string
      }
}

/**
 * @type {ServiceSchema} special case for service schemas
 */
export type ServiceSchema<T extends Obj = Obj> = RequireKeys<JsonSchema<T>, 'properties'>

/**
 * Merges two JSON schemas into one
 *
 * @param {ServiceSchema} a the source schema
 * @param {ServiceSchema} b the target schema
 * @returns {ServiceSchema} the final schema
 */
export const mergeServiceSchemas = <A extends Obj = Obj, B extends Obj = Obj>(
  a: ServiceSchema<A>,
  b: ServiceSchema<B>,
): ServiceSchema<A> & ServiceSchema<B> => {
  const { required: requiredA = [] } = a
  const { required: requiredB = [] } = b

  return {
    ...merge({}, a, b),
    required: uniq([...requiredA, ...requiredB]),
  }
}

/**
 * Returns the schema that matches the service's main attributes with the service reference id
 *
 * @param {BaseService} service the service to get the matcher for
 * @returns {JsonSchema}
 */
export const getServiceMatcher = (service: BaseService): JsonSchema => ({
  if: {
    properties: {
      provider: { const: service.provider },
      type: { const: service.type },
    },
  },
  then: {
    $ref: service.schemaId,
  },
})

/**
 * Populates the project schema
 *
 * @returns {JsonSchema<ServiceAttributes[]>}
 */
export const getSchema = (): JsonSchema<ServiceAttributes[]> => {
  const services = Services.all()

  const allOf = services.map((service) => getServiceMatcher(service))
  const $defs: Dictionary<JsonSchema<ServiceAttributes>> = fromPairs(
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
        name: getServiceNameSchema(),
        type: getServiceTypeSchema(Services.serviceTypes()),
        provider: getServiceProviderSchema(Services.providers()),
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
