import { merge, uniq } from 'lodash';

import { Obj } from '@stackmate/engine/types';
import { ProviderChoice, CloudService, CoreService } from '@stackmate/engine/core/service';

type SchemaType = "string" | "number" | "object" | "array" | "boolean" | "null";

export type JsonSchema<T = undefined> = {
  $id?: string;
  $ref?: string;

  ///////////////////////////////////////////////////////////////////////////
  // Schema Metadata
  ///////////////////////////////////////////////////////////////////////////
  /**
   * This is important because it tells refs where the root of the document is located
   */
  id?: string;
  /**
   * It is recommended that the meta-schema is included
   * in the root of any json schema and must be a uri
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
  default?: any;

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
  additionalItems?: boolean | JsonSchema;
  items?: JsonSchema | JsonSchema[];
  maxItems?: number;
  minItems?: number;
  uniqueItems?: boolean;

  ///////////////////////////////////////////////////////////////////////////
  // Object Validation
  ///////////////////////////////////////////////////////////////////////////
  maxProperties?: number;
  minProperties?: number;
  required?: string[];
  additionalProperties?: boolean | JsonSchema;
  /**
   * Holds simple JSON Schema definitions for referencing from elsewhere
   */
  $defs?: { [property: string]: JsonSchema };
  definitions?: T extends Obj ? { [K in keyof T]?: JsonSchema<T[K]> } : never;
  /**
   * The keys that can exist on the object with the json schema that should validate their value
   */
  properties?: T extends Obj
    ? { [K in keyof T]: JsonSchema<T[K]> }
    : { [property: string]: JsonSchema };

  /**
   * The key of this object is a regex for which properties the schema applies to
   */
  patternProperties?: T extends Obj
    ? { [pattern in keyof T]?: JsonSchema<T[pattern]> }
    : never;

  /**
   * If the key is present as a property then the string of properties must also be present.
   * If the value is a JSON Schema then it must also be valid for the object if the key is present.
   */
  dependencies?: T extends Obj
    ? { [key in keyof T]?: JsonSchema<T[key]> | string[] }
    : never;

  ///////////////////////////////////////////////////////////////////////////
  // Generic
  ///////////////////////////////////////////////////////////////////////////
  /**
   * Enumerates the values that this schema can be
   * (e.g. {"type": "string", "enum": ["red", "green", "blue"]})
   */
  enum?: any[] | readonly any[];
  /**
   * The basic type of this schema, can be one of
   * [string, number, object, array, boolean, null]
   * or an array of the acceptable types
   */
  type?: T extends undefined
          ? SchemaType
          : T extends number
            ? "number"
              : T extends string | symbol
                ? "string"
                : T extends boolean
                    ? "boolean"
                    : T extends string[] | number[] | boolean[] | object[]
                      ? "array"
                      : T extends null
                        ? "null"
                        : T extends object
                          ? "object"
                          : SchemaType; // explicitly defined

  format?: string;

  ///////////////////////////////////////////////////////////////////////////
  // Combining Schemas
  ///////////////////////////////////////////////////////////////////////////
  allOf?: JsonSchema[];
  anyOf?: JsonSchema[];
  oneOf?: JsonSchema[];
  /**
   * The entity being validated must not match this schema
   */
  not?: JsonSchema;
  if?: JsonSchema;
  then?: JsonSchema;
  else?: JsonSchema;

  // Stackmate-specific
  serviceLinks?: boolean;
  serviceProfile?: boolean;
  serviceProfileOverrides?: boolean;

  // AJV-error specific
  errorMessage?: string | {
    '_'?: string;
    type?: string;
    additionalProperties?: string;
    properties?: { [property: string]: string; } | {};
    required?: { [property: string]: string; } | {};
  };
};

/**
 * @type {ServiceSchema} special case for service schemas
 */
export type ServiceSchema<T extends Obj = {}> = JsonSchema<T> & {
  properties: { [K in keyof T]: JsonSchema<T[K]> };
};

/**
 * Merges two JSON schemas into one
 *
 * @param {ServiceSchema} a the source schema
 * @param {ServiceSchema} b the target schema
 * @returns {ServiceSchema} the final schema
 */
export const mergeServiceSchemas = <A extends Obj = {}, B extends Obj = {}>(
  a: ServiceSchema<A>, b: ServiceSchema<B>,
): ServiceSchema<A> & ServiceSchema<B> => {
  const { required: requiredA = [] } = a;
  const { required: requiredB = [] } = b;

  return {
    ...merge({}, a, b),
    required: uniq([...requiredA, ...requiredB]),
  };
};

export const getServiceSchemaCondition = (
  provider: ProviderChoice,
  serviceSchemaId: string,
  typeDiscrimination: { [p: string]: JsonSchema } = {},
  subSchemaGenerator: (props: JsonSchema) => JsonSchema,
): JsonSchema => ({
  if: {
    // The provider is either defined at root level,
    // or is explicitly defined in the service definition
    anyOf: [
      {
        // root provider is defined, nested provider is not
        allOf: [
          {
            required: ['provider'],
            properties: {
              ...typeDiscrimination,
              provider: { const: provider },
            },
          },
          // provider at service level is absent
          subSchemaGenerator({
            not: { required: ['provider'] },
            properties: typeDiscrimination,
          }),
        ],
      },
      // Provider is explicitly defined on the service type
      subSchemaGenerator({
        required: ['provider'],
        properties: {
          ...typeDiscrimination,
          provider: { const: provider },
        },
      }),
    ],
  },
  // In case this condition is true, we should apply another set of conditions
  // discriminated by service type, referencing the corresponding service's schema
  then: subSchemaGenerator({ $ref: serviceSchemaId }),
});

export const getCloudServiceConditionals = (service: CloudService): JsonSchema => (
  getServiceSchemaCondition(
    service.provider, service.schemaId, { type: { const: service.type } }, (props) => ({
      required: ['stages'],
      properties: {
        stages: {
          items: {
            required: ['services'],
            properties: {
              services: {
                items: props,
              },
            },
          },
        },
      },
    }),
  )
);

export const getCoreServiceConditional = (service: CoreService): JsonSchema => (
  getServiceSchemaCondition(
    service.provider, service.schemaId, { type: { const: service.type } }, (props) => ({
      required: [service.type],
      properties: { [service.type]: props },
    }),
  )
);

export const getRegionsSchema = (
  provider: ProviderChoice, regions: string[],
): JsonSchema<string> => ({
  $id: `regions/${provider}`,
  type: 'string',
  enum: regions,
  errorMessage: `The region is invalid. Available options are: ${regions.join(', ')}`,
});

export const getRegionConditional = (provider: ProviderChoice, schema: JsonSchema<string>) => {
  if (!schema.$id) {
    throw new Error('The $id property should be defined in the schema');
  }

  return {
    if: { properties: { provider: { const: provider } } },
    then: { properties: { region: { $ref: schema.$id } } },
  };
};
