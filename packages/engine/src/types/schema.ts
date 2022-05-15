import { PartialSchema } from 'ajv/dist/types/json-schema';
import { Diff, RequireKeys } from './util';

export type PartialJsonSchema<T> = RequireKeys<PartialSchema<T>, 'properties'>;
export type TargetJsonSchema<U, T> = RequireKeys<(PartialSchema<(Diff<T, U>)>), 'properties'>;
