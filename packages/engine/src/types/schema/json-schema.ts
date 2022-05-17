import { PartialSchema, PropertiesSchema } from 'ajv/dist/types/json-schema';
import { Diff, OptionalKeys } from '@stackmate/engine/types/util';

export type PartialJsonSchema<T> = OptionalKeys<PartialSchema<T>, 'properties'>;
export type TargetJsonSchema<U, T> = OptionalKeys<(PartialSchema<(Diff<T, U>)>), 'properties'>;
export type OmitProperties<T extends object, PropType> = {
  [K in keyof T]-?: T[K] extends PropType ? never : K
}[keyof T];

export interface JsonSchema<T> {
  $ref?: string;

  ///////////////////////////////////////////////////////////////////////////
  // Schema Metadata
  ///////////////////////////////////////////////////////////////////////////
  /**
   * This is important because it tells refs where the root of the document is located
   */
  id?: string;
  /**
   * It is recommended that the meta-schema is included in the root of any json schema and must be a uri
   */
  $schema?: string;
  /**
   * Title of the schema
   */
  title?: string;
  /**
   * Schema description
   */
  description?: string;
  /**
   * Default json for the object represented by this schema
   */
  'default'?: any;

  ///////////////////////////////////////////////////////////////////////////
  // Number Validation
  ///////////////////////////////////////////////////////////////////////////
  /**
   * The value must be a multiple of the number (e.g. 10 is a multiple of 5)
   */
  multipleOf?: number;
  maximum?: number;
  /**
   * If true maximum must be > value, >= otherwise
   */
  exclusiveMaximum?: boolean;
  minimum?: number;
  /**
   * If true minimum must be < value, <= otherwise
   */
  exclusiveMinimum?: boolean;

  ///////////////////////////////////////////////////////////////////////////
  // String Validation
  ///////////////////////////////////////////////////////////////////////////
  maxLength?: number;
  minLength?: number;
  /**
   * This is a regex string that the value must conform to
   */
  pattern?: string;

  ///////////////////////////////////////////////////////////////////////////
  // Array Validation
  ///////////////////////////////////////////////////////////////////////////
  additionalItems?: boolean | JsonSchema<T>;
  items?: JsonSchema<T> | JsonSchema<T>[];
  maxItems?: number;
  minItems?: number;
  uniqueItems?: boolean;

  ///////////////////////////////////////////////////////////////////////////
  // Object Validation
  ///////////////////////////////////////////////////////////////////////////
  maxProperties?: number;
  minProperties?: number;
  required?: string[];
  additionalProperties?: boolean | JsonSchema<T>;
  /**
   * Holds simple JSON Schema definitions for referencing from elsewhere
   */
  definitions?: { [key: string]: JsonSchema<T> };
  /**
   * The keys that can exist on the object with the json schema that should validate their value
   */
  properties?: PropertiesSchema<T>;

  /**
   * The key of this object is a regex for which properties the schema applies to
   */
  patternProperties?: { [pattern: string]: JsonSchema<T> };
  /**
   * If the key is present as a property then the string of properties must also be present.
   * If the value is a JSON Schema then it must also be valid for the object if the key is present.
   */
  dependencies?: { [key: string]: JsonSchema<T> | string[] };

  ///////////////////////////////////////////////////////////////////////////
  // Generic
  ///////////////////////////////////////////////////////////////////////////
  /**
   * Enumerates the values that this schema can be (e.g. {"type": "string", "enum": ["red", "green", "blue"]})
   */
  'enum'?: any[];
  /**
   * The basic type of this schema, can be one of [string, number, object, array, boolean, null] or an array of
   * the acceptable types
   */
  type?: string | string[];

  format?: string;

  ///////////////////////////////////////////////////////////////////////////
  // Combining Schemas
  ///////////////////////////////////////////////////////////////////////////
  allOf?: JsonSchema<T>[];
  anyOf?: JsonSchema<T>[];
  oneOf?: JsonSchema<T>[];
  /**
   * The entity being validated must not match this schema
   */
  not?: JsonSchema<T>;

  // AJV-error related entry
  errorMessage?: 'string' | {
    '_'?: string;

    properties?: {
      [K in keyof T]?: string;
    };

    required?: {
      [K in keyof T]?: string;
    }
  };
}
