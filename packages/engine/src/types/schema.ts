import { JSONSchemaType, PartialSchema } from 'ajv/dist/types/json-schema';
import { Diff, OptionalKeys } from './util';

export type PartialJsonSchema<T> = OptionalKeys<PartialSchema<T>, 'properties'>;
export type TargetJsonSchema<U, T> = OptionalKeys<(PartialSchema<(Diff<T, U>)>), 'properties'>;
export type JsonSchema<T> = JSONSchemaType<T>;
