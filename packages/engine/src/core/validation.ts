import addErrors from 'ajv-errors';
import addFormats from 'ajv-formats';
import Ajv, { AnySchemaObject, Options as AjvOptions, ErrorObject as AjvErrorObject } from 'ajv';
import { DataValidationCxt } from 'ajv/dist/types';
import { cloneDeep, defaults, difference, get, isEmpty, uniqBy } from 'lodash';

import { readSchemaFile } from '@stackmate/engine/core/schema';
import { getServiceProfile } from '@stackmate/engine/core/profile';
import { ServiceEnvironment } from '@stackmate/engine/core/service';
import { DEFAULT_PROFILE_NAME, JSON_SCHEMA_KEY, JSON_SCHEMA_ROOT } from '@stackmate/engine/constants';
import { Project, ProjectConfiguration } from '@stackmate/engine/core/project';

const ajvInstance: Ajv | null = null;

export type ErrorDescriptor = {
  path: string;
  message: string;
};

export class ValidationError extends Error {
  readonly errors: ErrorDescriptor[] = [];

  constructor(message: string, errors: ErrorDescriptor[]) {
    super(message);
    this.errors = errors;
  }
}

/**
 * Extracts the service names given a path in the schema
 *
 * @param {String} path the path to extract the services from
 * @param {Object} data the data to extract the service names from
 * @returns {String} the service names
 */
export const getServiceNamesFromPath = (path: string, data: object = {}): string[] => {
  if (!path || !path.startsWith('/stages')) {
    return [];
  }

  const stageName = path.replace(/\/stages\/([^\/]+)\/.*/, '$1');
  if (!stageName) {
    throw new Error('Stage not found in the schema');
  }

  return Object.keys(get(data, ['stages', stageName]));
};

/**
 * Validates a service `profile` value
 *
 * @param {Any|JsonSchema} schema the schema to use for validation
 * @param {Any|String} profile the value for the profile attribute
 * @param {AnySchemaObject} parentSchema the parent schema
 * @param {DataValidationCxt} dataCxt the data validation context
 * @returns {Boolean} whether the service profile validates
 */
export const validateServiceProfile = (
  schema: any, profile: any, parentSchema?: AnySchemaObject, dataCxt?: DataValidationCxt,
): boolean => {
  const type = get(dataCxt?.parentData, 'type');
  const provider = get(dataCxt?.parentData, 'provider', get(dataCxt?.rootData, 'provider', null));

  if (!provider || !type) {
    return false;
  }

  try {
    getServiceProfile(provider, type, profile);
    return true;
  } catch (err) {
    return false;
  }
};

/**
 * Validates a profile `overrides` value
 *
 * @param {Any|JsonSchema} schema the schema to use for validation
 * @param {Any|Object} overrides the value for overrides to validate
 * @param {AnySchemaObject} parentSchema the parent schema
 * @param {DataValidationCxt} dataCxt the data validation context
 * @returns {Boolean} whether the overrides value validates
 */
export const validateServiceProfileOverrides = (
  schema: any, overrides: any, parentSchema?: AnySchemaObject, dataCxt?: DataValidationCxt,
): boolean => {
  const type = get(dataCxt?.parentData, 'type');
  const profile = get(dataCxt?.parentData, 'profile', DEFAULT_PROFILE_NAME);
  const provider = get(dataCxt?.parentData, 'provider', get(dataCxt?.rootData, 'provider', null));

  if (!provider || !type) {
    return false;
  }

  try {
    const serviceOverrides = getServiceProfile(provider, type, profile);
    const irrelevantKeys = difference(Object.keys(overrides), Object.keys(serviceOverrides))
    return isEmpty(irrelevantKeys);
  } catch (err) {
    return false;
  }
};

/**
 * Validates a `links` value
 *
 * @param {Any|JsonSchema} schema the schema to use for validation
 * @param {Any|String[]} links the value for overrides to validate
 * @param {AnySchemaObject} parentSchema the parent schema
 * @param {DataValidationCxt} dataCxt the data validation context
 * @returns {Boolean} whether the links value validates
 */
export const validateServiceLinks = (
  schema: any, links: any, parentSchema?: AnySchemaObject, dataCxt?: DataValidationCxt,
): boolean => {
  // We should allow service links only for cloud services
  const block = dataCxt?.parentData || {};
  const path = dataCxt?.instancePath || null;
  if (!path || !block) {
    return true;
  }

  // Get the stage's service names
  const serviceNames = getServiceNamesFromPath(path, dataCxt?.rootData);
  if (isEmpty(links)) {
    return true;
  }

  // Detect any service names that are not available within the schema
  const irrelevantServices = difference(links, serviceNames);
  return isEmpty(irrelevantServices);
};

/**
 * Returns or creates an Ajv instance
 *
 * @param {AjvOptions} opts the options to use with Ajv
 * @returns {Ajv} the Ajv instance
 */
export const getAjv = (opts: AjvOptions = {}): Ajv => {
  if (ajvInstance) {
    return ajvInstance;
  }

  const defaultOptions: AjvOptions = {
    useDefaults: true,
    allErrors: true,
    discriminator: false,
    removeAdditional: true,
    coerceTypes: true,
    allowMatchingProperties: true,
    strict: false,
  };

  const ajv = new Ajv(defaults({ ...opts }, defaultOptions));

  addFormats(ajv);

  addErrors(ajv, { // https://ajv.js.org/packages/ajv-errors.html
    keepErrors: false,
    singleError: false,
  });

  ajv.addKeyword({  // no-op for config generator
    keyword: 'isIncludedInConfigGeneration',
    type: 'boolean',
  });

  ajv.addKeyword({  // no-op for config generator
    keyword: 'serviceConfigGenerationTemplate',
    type: 'string',
  });

  ajv.addKeyword({
    keyword: 'serviceLinks',
    type: 'array',
    error: { message: 'Invalid service links defined' },
    validate: validateServiceLinks,
  });

  ajv.addKeyword({
    keyword: 'serviceProfile',
    type: 'string',
    error: { message: 'Invalid service profile defined' },
    validate: validateServiceProfile,
  });

  ajv.addKeyword({
    keyword: 'serviceProfileOverrides',
    type: 'object',
    error: { message: 'Invalid profile overrides defined' },
    validate: validateServiceProfileOverrides,
  });

  return ajv;
};

/**
 * Loads the main json schema into ajv
 *
 * @param {Ajv} ajv the ajv instance
 * @param {String} schemaKey the key to use for the ajv schema cache
 * @param {Object} opts additional options
 * @param {Boolean} opts.refresh whether to refresh the schema on the ajv instance
 * @void
 */
export const loadJsonSchema = (
  ajv: Ajv, schemaKey = JSON_SCHEMA_KEY, { refresh = false } = {},
) => {
  if (ajv.schemas[schemaKey] && !refresh) {
    return;
  } else if (refresh) {
    ajv.removeSchema(schemaKey);
  }

  ajv.addSchema(readSchemaFile(), schemaKey);
};

/**
 * Validates an attribute-set against a schema id found in the schema
 *
 * @param {String} schemaId the schema id to use for validation
 * @param {Any} data the data to validate
 * @param {AjvOptions} options any Ajv options to use
 * @returns {Object} the clean / validated attributes
 */
export const validate = (
  schemaId: string, data: any, options: AjvOptions = {},
): any => {
  if (!schemaId) {
    throw new Error('A schema ID should be provided');
  }

  const ajv = getAjv(options);
  loadJsonSchema(ajv);

  const validData = options.useDefaults ? cloneDeep(data) : data;
  const validateData = ajv.getSchema(schemaId);

  if (!validateData) {
    throw new Error(`Invalid schema definition “${schemaId}”`);
  }

  if (!validateData(validData) && !isEmpty(validateData.errors)) {
    const errors = parseErrors(validateData.errors || [])
    throw new ValidationError(`Error while validating schema ${schemaId}`, errors);
  }

  return validData;
};

/**
 * Validates a single property in the schema
 *
 * @param {String} property the name of the property to validate
 * @param {Any} data the data to validate
 * @param {String} root the root for the property
 * @returns {Any}
 */
export const validateProperty = (property: string, data: any, root = JSON_SCHEMA_ROOT): any => (
  validate(`${root}#/properties/${property}`, data)
);

/**
 * Parses Ajv errors to custom, error descriptors
 *
 * @param {AjvErrorObject[]} errors the raw, AJV errors available
 * @returns {ErrorDescriptor[]} the parsed errors
 */
export const parseErrors = (errors: AjvErrorObject[]): ErrorDescriptor[] => {
  const errs = errors.filter(
    ({ keyword }) => !['if', 'then'].includes(keyword),
  ).map(({ instancePath, message }) => {
    const path = instancePath.replace(/\//g, '.').replace(/^\.(.*)/gi, '$1');
    const defaultMessage = `Property ${path} is invalid`;
    return { path, message: message || defaultMessage };
  });

  return uniqBy(errs, ({ path, message }) => `${path}-${message}`);
};

/**
 * Validates an operation's environment variables
 *
 * @param {ServiceEnvironment[]} vars the environment variables to validate
 * @throws {Error} if the environment is not properly set up
 */
export const validateEnvironment = (vars: ServiceEnvironment[], env = process.env) => {};

/**
 * Validates a project configuration
 *
 * @param {ProjectConfiguration} config the project's configuration
 * @param {AjvOptions} opts any options to pass to Ajv
 * @returns {Project} the validated project
 */
export const validateProject = (config: ProjectConfiguration, opts: AjvOptions = {}): Project => (
  validate(JSON_SCHEMA_ROOT, config, opts) as unknown as Project
);
