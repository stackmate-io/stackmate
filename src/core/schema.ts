import fs from 'node:fs'
import { isEmpty, merge, uniq } from 'lodash'

import type { Obj, RequireKeys } from '@lib/util'
import { JSON_SCHEMA_PATH, SERVICE_TYPE } from '@constants'
import type { BaseService, ProviderChoice, ServiceTypeChoice } from '@core/service/core'
import { isCoreService } from '@core/service/core'

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
  $defs?: { [property: string]: JsonSchema }

  definitions?: T extends Obj ? { [K in keyof T]?: JsonSchema<T[K]> } : never
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
  isIncludedInConfigGeneration?: boolean
  serviceConfigGenerationTemplate?: string

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
 * Returns the stored JSON schema file. The schema is generated at build time and is
 * bundled within the app's distribution files.
 *
 * @returns {JsonSchema} the schema
 */
export const readSchemaFile = (): JsonSchema<Obj> => {
  if (!fs.existsSync(JSON_SCHEMA_PATH)) {
    throw new Error('JSON Schema file not found')
  }

  const content = fs.readFileSync(JSON_SCHEMA_PATH).toString()
  return JSON.parse(content)
}

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
 * Returns the schema for a set of a provider's regions
 *
 * @param {ProviderChoice} provider the provider to register the regions for
 * @param {String[]} regions the regions available for the provider
 * @returns {JsonSchema} the regions schema
 */
export const getRegionsSchema = (
  provider: ProviderChoice,
  regions: string[],
): JsonSchema<string> => ({
  $id: `regions/${provider}`,
  type: 'string',
  enum: regions,
  errorMessage: {
    enum: `The region is invalid. Available options are: ${regions.join(', ')}`,
  },
})

/**
 * Returns a conditional schema for the regions, that allows us to validate different
 * regions per provider (at project level)
 *
 * @param {ProviderChoice} provider the provider associated with the regions
 * @param {JsonSchema} schema the regions schema definition
 * @returns {JsonSchema} the conditionals for the regions
 * @see {getRegionsSchema}
 */
export const getRegionConditional = (provider: ProviderChoice, schema: JsonSchema<string>) => {
  if (!schema.$id) {
    throw new Error('The $id property should be defined in the schema')
  }

  return {
    if: { properties: { provider: { const: provider } } },
    then: { properties: { region: { $ref: schema.$id } } },
  }
}

/**
 * Returns the schemas to be used when validating either core or cloud services
 *
 * How the validtion works:
 *  - it uses the `provider` property assigned in the service configuration (if any)
 *  - otherwise it uses the default cloud provider (the one set at root level)
 *  - adds a discrimination based on the service's type and points to the specific reference
 *
 * @param {ProviderChoice} provider the provider to get the validations schema for
 * @returns {JsonSchema[]} the stage services validation schema
 */
export const getProviderServiceSchemas = (provider: ProviderChoice, services: BaseService[]) => {
  const schemas: RequireKeys<JsonSchema, '$id'>[] = []
  const cloudServices = services.filter((srv) => !isCoreService(srv.type))
  const rootCoreServiceTypes = [
    SERVICE_TYPE.STATE,
    SERVICE_TYPE.SECRETS,
    SERVICE_TYPE.MONITORING,
  ] as ServiceTypeChoice[]

  // Start with the root-level core services (eg. state, secrets, monitoring)
  services
    .filter((srv) => rootCoreServiceTypes.includes(srv.type))
    .forEach((service) => {
      schemas.push({
        $id: `${provider}-${service.type}-core-service`,
        if: {
          anyOf: [
            {
              // Provider is defined at root-level, not defined on the core service configuration
              properties: {
                provider: { const: provider },
                [service.type]: { not: { required: ['provider'] } },
              },
            },
            {
              // Provider is explicitly defined at core service configuration level
              properties: {
                [service.type]: {
                  required: ['provider'],
                  properties: { provider: { const: provider } },
                },
              },
            },
          ],
        },
        then: {
          properties: { [service.type]: { $ref: service.schemaId } },
        },
      })
    })

  // Finally, add the provider's cloud services
  if (!isEmpty(cloudServices)) {
    schemas.push({
      $id: `${provider}-cloud-services`,
      if: {
        // Provider defined at root-level
        properties: { provider: { const: provider } },
      },
      then: {
        properties: {
          stages: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                services: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      // Set the accepted service types
                      type: {
                        enum: cloudServices.map((srv) => srv.type),
                      },
                    },
                    // Add type discriminations for every cloud service available
                    allOf: cloudServices.map(
                      (service): JsonSchema => ({
                        if: {
                          anyOf: [
                            {
                              // Provider is not defined at service level
                              not: { required: ['provider'] },
                              properties: {
                                type: { const: service.type },
                              },
                            },
                            {
                              // Provider is defined set to the current one
                              required: ['provider'],
                              properties: {
                                provider: { const: provider },
                                type: { const: service.type },
                              },
                            },
                          ],
                        },
                        then: {
                          $ref: service.schemaId,
                        },
                      }),
                    ),
                  },
                },
              },
            },
          },
        },
      },
    })
  }

  return schemas
}
