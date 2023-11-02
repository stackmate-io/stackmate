import Ajv from 'ajv'
import addErrors from 'ajv-errors'
import addFormats from 'ajv-formats'
import { cloneDeep, defaults, difference, get, isEmpty, uniqBy } from 'lodash'
import { readSchemaFile } from '@core/schema'
import { isAddressValid } from '@lib/networking'
import { getServiceProfile } from '@core/profile'
import { DEFAULT_PROFILE_NAME, JSON_SCHEMA_KEY } from '@constants'
import { ValidationError, EnvironmentValidationError } from '@lib/errors'
import type { DataValidationCxt } from 'ajv/dist/types'
import type { Options as AjvOptions, ErrorObject as AjvErrorObject } from 'ajv'
import type { CloudServiceConfiguration } from '@core/project'
import type { ServiceEnvironment } from '@core/service'
import type { ValidationErrorDescriptor } from '@lib/errors'

export const AJV_OPTIONS: AjvOptions = {
  useDefaults: true,
  allErrors: true,
  discriminator: false,
  removeAdditional: true,
  coerceTypes: true,
  allowMatchingProperties: true,
  strict: false,
  $data: true,
} as const

/**
 * Validates a service `profile` value
 *
 * @param {Any|String} profile the value for the profile attribute
 * @param {DataValidationCxt} dataCxt the data validation context
 * @returns {Boolean} whether the service profile validates
 */
export const validateServiceProfile = (profile: any, dataCxt?: DataValidationCxt): boolean => {
  const type = get(dataCxt?.parentData, 'type')
  const provider = get(dataCxt?.parentData, 'provider', get(dataCxt?.rootData, 'provider', null))

  if (!provider || !type) {
    return false
  }

  try {
    getServiceProfile(provider, type, profile)
    return true
  } catch (err) {
    return false
  }
}

/**
 * Validates a profile `overrides` value
 *
 * @param {Any|Object} overrides the value for overrides to validate
 * @param {DataValidationCxt} dataCxt the data validation context
 * @returns {Boolean} whether the overrides value validates
 */
export const validateServiceProfileOverrides = (
  overrides: any,
  dataCxt?: DataValidationCxt,
): boolean => {
  const type = get(dataCxt?.parentData, 'type')
  const profile = get(dataCxt?.parentData, 'profile', DEFAULT_PROFILE_NAME)
  const provider = get(dataCxt?.parentData, 'provider', get(dataCxt?.rootData, 'provider', null))

  if (!provider || !type) {
    return false
  }

  try {
    const serviceOverrides = getServiceProfile(provider, type, profile)
    const irrelevantKeys = difference(Object.keys(overrides), Object.keys(serviceOverrides))
    return isEmpty(irrelevantKeys)
  } catch (err) {
    return false
  }
}

/**
 * Validates a `links` value
 *
 * @param {Any|String[]} links the value for overrides to validate
 * @param {DataValidationCxt} dataCxt the data validation context
 * @returns {Boolean} whether the links value validates
 */
export const validateServiceLinks = (links: any, dataCxt?: DataValidationCxt): boolean => {
  if (isEmpty(links)) {
    return true
  }

  // We should allow service links only for cloud services
  const block = dataCxt?.parentData || {}
  const path = dataCxt?.instancePath || null

  if (!path || !block) {
    return true
  }

  // Get the project's service names
  const serviceNames = path?.startsWith('/services')
    ? get(dataCxt?.rootData || {}, 'services', []).map((cfg: CloudServiceConfiguration) => cfg.name)
    : []

  // Detect any service names that are not available within the schema
  const irrelevantServices = difference(links, serviceNames)
  return isEmpty(irrelevantServices)
}

/**
 * Returns or creates an Ajv instance
 *
 * @param {AjvOptions} opts the options to use with Ajv
 * @returns {Ajv} the Ajv instance
 */
export const getAjv = (opts: AjvOptions = {}): Ajv => {
  const ajv = new Ajv(defaults({ ...opts }, AJV_OPTIONS))

  addFormats(ajv)

  addErrors(ajv, {
    // https://ajv.js.org/packages/ajv-errors.html
    keepErrors: false,
    singleError: false,
  })

  ajv.addKeyword({
    keyword: 'serviceLinks',
    async: false,
    errors: true,
    error: { message: 'Invalid links provided for the service' },
    compile: () => validateServiceLinks,
  })

  ajv.addKeyword({
    keyword: 'serviceProfile',
    type: 'string',
    error: { message: 'Invalid service profile defined' },
    compile: () => validateServiceProfile,
  })

  ajv.addKeyword({
    keyword: 'serviceProfileOverrides',
    type: 'object',
    error: { message: 'Invalid profile overrides defined' },
    compile: () => validateServiceProfileOverrides,
  })

  ajv.addKeyword({
    keyword: 'isIpOrCidr',
    type: 'string',
    error: { message: 'Invalid IP specified' },
    compile: () => isAddressValid,
  })

  return ajv
}

/**
 * Loads the main json schema into ajv
 *
 * @param {Ajv} ajv the ajv instance
 * @param {String} schemaKey the key to use for the ajv schema cache
 * @param {Object} opts additional options
 * @param {Boolean} opts.refresh whether to refresh the schema on the ajv instance
 * @void
 */
export const loadJsonSchema = (ajv: Ajv, schemaKey = JSON_SCHEMA_KEY, { refresh = false } = {}) => {
  if (ajv.schemas[schemaKey] && !refresh) {
    return
  } else if (refresh) {
    ajv.removeSchema(schemaKey)
  }

  ajv.addSchema(readSchemaFile(), schemaKey)
}

/**
 * Validates an attribute-set against a schema id found in the schema
 *
 * @param {String} schemaId the schema id to use for validation
 * @param {Any} data the data to validate
 * @param {AjvOptions} options any Ajv options to use
 * @returns {Object} the clean / validated attributes
 */
export const validate = (schemaId: string, data: any, options: AjvOptions = {}): any => {
  if (!schemaId) {
    throw new Error('A schema ID should be provided')
  }

  const ajv = getAjv(options)
  loadJsonSchema(ajv)

  const validData = options.useDefaults ? cloneDeep(data) : data
  const validateData = ajv.getSchema(schemaId)

  if (!validateData) {
    throw new Error(`Invalid schema definition “${schemaId}”`)
  }

  if (!validateData(validData) && !isEmpty(validateData.errors)) {
    const errors = parseErrors(validateData.errors || [])
    throw new ValidationError(`Error while validating schema ${schemaId}`, errors)
  }

  return validData
}

/**
 * Parses Ajv errors to custom, error descriptors
 *
 * @param {AjvErrorObject[]} errors the raw, AJV errors available
 * @returns {ValidationErrorDescriptor[]} the parsed errors
 */
export const parseErrors = (errors: AjvErrorObject[]): ValidationErrorDescriptor[] => {
  const errs = errors
    .filter(({ keyword }) => !['if', 'then'].includes(keyword))
    .map(({ instancePath, message }) => {
      const path = instancePath.replace(/\//g, '.').replace(/^\.(.*)/gi, '$1')
      const defaultMessage = `Property ${path} is invalid`
      return { path, message: message || defaultMessage }
    })

  return uniqBy(errs, ({ path, message }) => `${path}-${message}`)
}

/**
 * Validates an operation's environment variables
 *
 * @param {ServiceEnvironment[]} required the variables required in the environment
 * @throws {Error} if the environment is not properly set up
 */
export const validateEnvironment = (required: ServiceEnvironment[], env = process.env): void => {
  const missing: string[] = []

  required.forEach((envVar) => {
    if (!envVar.required) {
      return false
    }

    if (!(envVar.name in env)) {
      missing.push(envVar.name)
    }
  })

  if (!isEmpty(missing)) {
    throw new EnvironmentValidationError(
      `Your environment is missing some variables: ${missing.join(', ')}`,
      missing,
    )
  }
}
