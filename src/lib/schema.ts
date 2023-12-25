import { merge, uniq } from 'lodash'
import type { Obj } from '@lib/util'

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
   * Documentation url
   */
  documentation?: string
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
      ? { [K in keyof T]?: JsonSchema<T[K]> } | { [K: string]: JsonSchema<any> } | JsonSchema<any>
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
  uniqueAppDomains?: boolean

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
 * Merges two JSON schemas into one
 *
 * @param {JsonSchema} a the source schema
 * @param {JsonSchema} b the target schema
 * @returns {JsonSchema} the final schema
 */
export const mergeSchemas = <A extends Obj = Obj, B extends Obj = Obj>(
  a: JsonSchema<A>,
  b: JsonSchema<B>,
): JsonSchema<A> & JsonSchema<B> => {
  const { required: requiredA = [] } = a
  const { required: requiredB = [] } = b

  return {
    ...merge({}, a, b),
    required: uniq([...requiredA, ...requiredB]),
  }
}
