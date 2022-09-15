import addErrors from 'ajv-errors';
import addFormats from 'ajv-formats';
import Ajv, { AnySchemaObject, Options as AjvOptions } from 'ajv';
import { defaults, difference, get, isEmpty } from 'lodash';
import { DataValidationCxt } from 'ajv/dist/types';

import { Obj } from '@stackmate/engine/types';
import { readSchemaFile } from '@stackmate/engine/core/schema';
import { getServiceProfile } from '@stackmate/engine/core/profile';
import { DEFAULT_PROFILE_NAME } from '@stackmate/engine/constants';

const ajvInstance: Ajv | null = null;

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
const getAjv = (opts: AjvOptions = {}): Ajv => {
  if (ajvInstance) {
    return ajvInstance;
  }

  const options = defaults({ ...opts }, {
    useDefaults: true,
    allErrors: true,
    discriminator: true,
    removeAdditional: true,
    coerceTypes: true,
    allowMatchingProperties: true,
    strict: false,
  })

  const ajv = new Ajv(options);

  addFormats(ajv);
  addErrors(ajv, { keepErrors: false, singleError: false });

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

  const schema = readSchemaFile();
  ajv.addSchema(schema);

  return ajv;
};

/**
 * Validates an attribute-set against a schema id found in the schema
 *
 * @param {Object} attributes the data to validate
 * @param {String} schemaId the schema id to use for validation
 * @param {AjvOptions} ajvOptions any Ajv options to use
 * @returns {Object} the clean / validated attributes
 */
export const validate = <T extends Obj = {}>(
  attributes: T, schemaId: string = '', ajvOptions: AjvOptions = {},
): T => {
  const ajv = getAjv(ajvOptions);
  const validAttributes = { ...attributes };

  const runValidations = ajv.getSchema(schemaId);
  if (!runValidations) {
    throw new Error(`Invalid schema definition “${schemaId}”`);
  }

  if (!runValidations(attributes)) {
    const errors = ajv.errors;

    const { inspect } = require('util');
    console.debug(inspect(errors, { depth: 30 }));

    throw new Error('oops');
  }

  return validAttributes;
};
