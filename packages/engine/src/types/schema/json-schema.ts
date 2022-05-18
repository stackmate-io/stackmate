export interface JsonSchema<T> extends BaseJsonSchema {
  // properties?: { [k in keyof Required<T>]: BaseJsonSchema };

  // AJV-error related entry
  errorMessage?: string | {
    '_'?: string;
    properties?: { [K in keyof T]?: string; };
    required?: { [K in keyof T]?: string; };
  };
}

interface BaseJsonSchema {

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
   * Constant value for a property or schema
   */
  const?: any;
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
  additionalItems?: boolean | BaseJsonSchema;
  items?: BaseJsonSchema | BaseJsonSchema[];
  maxItems?: number;
  minItems?: number;
  uniqueItems?: boolean;

  ///////////////////////////////////////////////////////////////////////////
  // Object Validation
  ///////////////////////////////////////////////////////////////////////////
  maxProperties?: number;
  minProperties?: number;
  required?: string[];
  additionalProperties?: boolean | BaseJsonSchema;
  /**
   * Holds simple JSON Schema definitions for referencing from elsewhere
   */
  definitions?: { [key: string]: BaseJsonSchema };
  /**
   * The keys that can exist on the object with the json schema that should validate their value
   */
  properties?: { [property: string]: BaseJsonSchema };
  /**
   * The key of this object is a regex for which properties the schema applies to
   */
  patternProperties?: { [pattern: string]: BaseJsonSchema };
  /**
   * If the key is present as a property then the string of properties must also be present.
   * If the value is a JSON Schema then it must also be valid for the object if the key is present.
   */
  dependencies?: { [key: string]: BaseJsonSchema | string[] };

  ///////////////////////////////////////////////////////////////////////////
  // Generic
  ///////////////////////////////////////////////////////////////////////////
  /**
   * Enumerates the values that this schema can be (e.g. {"type": "string", "enum": ["red", "green", "blue"]})
   */
  'enum'?: any[] | readonly any[];
  /**
   * The basic type of this schema, can be one of [string, number, object, array, boolean, null] or an array of
   * the acceptable types
   */
  type?: string | string[];

  format?: string;

  ///////////////////////////////////////////////////////////////////////////
  // Combining Schemas
  ///////////////////////////////////////////////////////////////////////////
  allOf?: BaseJsonSchema[];
  anyOf?: BaseJsonSchema[];
  oneOf?: BaseJsonSchema[];
  /**
   * The entity being validated must not match this schema
   */
  not?: BaseJsonSchema;

  // Stackmate-specific
  serviceProfile?: boolean;
  serviceLinks?: boolean;
  serviceProfileOverrides?: boolean;

  // AJV-error specific
  errorMessage?: string | {
    '_'?: string;
    properties?: { [property: string]: string; } | {};
    required?: { [property: string]: string; } | {};
  };
}
