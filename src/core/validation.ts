import Ajv from 'ajv'
import addErrors from 'ajv-errors'
import addFormats from 'ajv-formats'
import {
  cloneDeep,
  defaults,
  difference,
  fromPairs,
  get,
  isEmpty,
  isFunction,
  uniqBy,
} from 'lodash'
import { isAddressValid } from '@lib/networking'
import { getServiceProfile } from '@core/profile'
import { DEFAULT_PROFILE_NAME } from '@constants'
import { ValidationError, EnvironmentValidationError } from '@lib/errors'
import { Services, type ServiceConfiguration, type ServiceAttributes } from '@core/registry'
import { getServiceNameSchema, getServiceTypeSchema, getServiceProviderSchema } from '@core/service'
import type { BaseServiceAttributes, ServiceEnvironment } from '@core/service'
import type { JsonSchema } from '@lib/schema'
import type { Dictionary } from 'lodash'
import type { DataValidationCxt } from 'ajv/dist/types'
import type { Options as AjvOptions, ErrorObject as AjvErrorObject } from 'ajv'
import type { ValidationErrorDescriptor } from '@lib/errors'

const AJV_DEFAULTS: AjvOptions = {
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
  const serviceNames = path?.match(/[0-9]+\/links/gi)
    ? (dataCxt?.rootData || []).map((cfg: ServiceConfiguration) => cfg.name)
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
  const ajv = new Ajv(defaults({ ...opts }, AJV_DEFAULTS))

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

/**
 * Populates the project schema
 *
 * @returns {JsonSchema<ServiceAttributes[]>}
 */
export const getSchema = (): JsonSchema<ServiceAttributes[]> => {
  const services = Services.all()

  const allOf = services.map((service) => ({
    if: {
      properties: {
        provider: { const: service.provider },
        type: { const: service.type },
      },
    },
    then: {
      $ref: service.schemaId,
    },
  }))

  const $defs: Dictionary<JsonSchema<BaseServiceAttributes>> = fromPairs(
    services.map((service) => [service.schemaId, service.schema]),
  )

  return {
    $id: 'stackmate-services-configuration',
    $schema: 'http://json-schema.org/draft-07/schema',
    type: 'array',
    minItems: 1,
    uniqueItems: true,
    errorMessage: {
      minItems: 'You should define at least one service to deploy',
    },
    items: {
      type: 'object',
      additionalProperties: true,
      required: ['name', 'type', 'provider'],
      properties: {
        name: getServiceNameSchema(),
        type: getServiceTypeSchema(Services.types()),
        provider: getServiceProviderSchema(Services.providers()),
      },
      allOf,
      errorMessage: {
        required: {
          name: 'Every service should feature a "name" property',
          type: 'Every service should feature a "type" property',
          provider: 'Every service should feature a "provider" property',
        },
      },
    },
    $defs,
  }
}
