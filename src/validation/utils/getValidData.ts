import { ValidationError } from '@src/lib/errors'
import { defaults, cloneDeep, isFunction } from 'lodash'
import type { JsonSchema } from '@src/lib/schema'
import type { Options as AjvOptions } from 'ajv'
import { getAjv } from './getAjv'
import { parseErrors } from './parseErrors'
import { AJV_DEFAULTS } from '../constants'

/**
 * Returns the validated data according to a given schema
 *
 * @param {object} rawData the raw data to validate
 * @param {JsonSchema} schema the schema to use for validation
 * @param {AjvOptions} options the ajv options to use
 * @returns {object} the validated data, mutated by ajv
 * @throws {ValidationError}
 */

export const getValidData = <R, T>(
  rawData: R,
  schema: JsonSchema<T>,
  options: AjvOptions = {},
): T => {
  const ajv = getAjv(defaults(options, AJV_DEFAULTS))

  const schemaId = schema.$id

  if (!schemaId) {
    throw new Error('A schema ID should be provided')
  }

  if (!ajv.schemas[schemaId]) {
    ajv.addSchema(schema, schemaId)
  }

  // We need to clone the data because when using defaults, the data gets mutated
  // this can lead to all kinds of errors and the impression that data isn't valid
  const data = cloneDeep(rawData)
  const validateData = ajv.getSchema(schemaId)

  if (!isFunction(validateData)) {
    throw new Error('The schema provided was invalid')
  }

  if (!validateData(data)) {
    const errors = parseErrors(validateData.errors || [])
    throw new ValidationError(`Error while validating schema ${schemaId}`, errors)
  }

  return data as unknown as T
}
