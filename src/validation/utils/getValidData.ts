import { defaults, cloneDeep, isFunction } from 'lodash'
import { ValidationError } from '@src/lib/errors'
import { AJV_DEFAULTS } from '@src/validation/constants'
import { isTestMode } from '@src/constants'
import type { Options as AjvOptions } from 'ajv'
import type { JsonSchema } from '@src/lib/schema'
import { getAjv } from './getAjv'
import { parseErrors } from './parseErrors'

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
    const errors = parseErrors(validateData.errors || [], data)
    if (isTestMode) {
      console.log('ajv errors', validateData.errors) // eslint-disable-line no-console
      console.log('data', data) // eslint-disable-line no-console
    }
    throw new ValidationError(`Error while validating schema ${schemaId}`, errors)
  }

  return data as unknown as T
}
