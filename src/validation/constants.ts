import type { Options as AjvOptions } from 'ajv'

export const AJV_DEFAULTS: AjvOptions = {
  useDefaults: true,
  allErrors: true,
  discriminator: false,
  removeAdditional: true,
  coerceTypes: true,
  allowMatchingProperties: true,
  strict: false,
  $data: true,
} as const

export const JSON_SCHEMA_DRAFT = 'http://json-schema.org/draft-07/schema'
