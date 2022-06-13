import fs from 'node:fs';

import Ajv, { AnySchemaObject } from 'ajv';
import { difference, get, isEmpty } from 'lodash';
import { DataValidationCxt } from 'ajv/dist/types';
import addFormats from 'ajv-formats';
import addErrors from 'ajv-errors';

import { DEFAULT_PROFILE_NAME, JSON_SCHEMA_PATH, SERVICE_TYPE } from '@stackmate/engine/constants';
import { EntityAttributes, Project as StackmateProject } from '@stackmate/engine/types';
import Profile from './profile';

const readSchema = () => {
  if (!fs.existsSync(JSON_SCHEMA_PATH)) {
    throw new Error('JSON Schema file not found');
  }

  const content = fs.readFileSync(JSON_SCHEMA_PATH).toString();
  return JSON.parse(content);
};

export const getServiceNamesFromPath = (path: string, data: object = {}): string[] => {
  if (!path || !path.startsWith('/stages')) {
    return [];
  }

  const stageName = path.replace(/\/stages\/([^\/]+)\/.*/, '$1');
  if (!stageName) {
    throw new Error('Stage not found in the schema');
  }

  return Object.keys(get(data, ['stages', stageName]));
}

const SCHEMA = readSchema();

const ajv = new Ajv({
  allErrors: true,
  discriminator: true,
  removeAdditional: true,
  useDefaults: true,
  coerceTypes: true,
  allowMatchingProperties: true,
  strict: false,
});

addFormats(ajv);
addErrors(ajv, { keepErrors: false, singleError: false });

ajv.addKeyword({
  keyword: 'serviceLinks',
  type: 'array',
  error: {
    message: 'Invalid service links defined',
  },
  validate(schema: any, links: any, parentSchema?: AnySchemaObject, dataCxt?: DataValidationCxt) {
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
  },
});

ajv.addKeyword({
  keyword: 'serviceProfile',
  type: 'string',
  error: {
    message: 'Invalid service profile defined',
  },
  validate(schema: any, profile: any, parentSchema?: AnySchemaObject, dataCxt?: DataValidationCxt) {
    const type = get(dataCxt?.parentData, 'type');
    const provider = get(dataCxt?.parentData, 'provider', get(dataCxt?.rootData, 'provider', null));

    if (!provider || !type) {
      throw new Error('The provider and service type should be specified')
    }

    if (
      type === SERVICE_TYPE.STATE || type == SERVICE_TYPE.VAULT || type === SERVICE_TYPE.PROVIDER
    ) {
      return true;
    }

    try {
      Profile.get(provider, type, profile);
      return true;
    } catch (err) {
      return false;
    }
  },
});

ajv.addKeyword({
  keyword: 'serviceProfileOverrides',
  type: 'object',
  error: {
    message: 'Invalid profile overrides defined',
  },
  validate(schema: any, overrides: any, parentSchema?: AnySchemaObject, dataCxt?: DataValidationCxt) {
    const type = get(dataCxt?.parentData, 'type');
    const profile = get(dataCxt?.parentData, 'profile', DEFAULT_PROFILE_NAME);
    const provider = get(dataCxt?.parentData, 'provider', get(dataCxt?.rootData, 'provider', null));

    if (!provider || !type) {
      throw new Error('The provider and service type should be specified')
    }

    if (
      type === SERVICE_TYPE.STATE || type == SERVICE_TYPE.VAULT || type === SERVICE_TYPE.PROVIDER
    ) {
      return true;
    }

    try {
      const serviceOverrides = Profile.get(provider, type, profile);
      const irrelevantKeys = difference(Object.keys(overrides), Object.keys(serviceOverrides))
      return isEmpty(irrelevantKeys);
    } catch (err) {
      return false;
    }
  }
})

ajv.compile<StackmateProject.Schema>(SCHEMA);

const validate = (attributes: EntityAttributes, schemaId: string = ''): EntityAttributes => {
  const validAttributes = { ...attributes };
  const runValidations = ajv.getSchema(schemaId);

  if (!runValidations) {
    throw new Error(`Invalid schema definition “${schemaId}”`);
  }

  const isValid = runValidations(attributes);

  if (!isValid) {
    const errors = runValidations.errors;

    const { inspect } = require('util');
    console.log(inspect(errors, { depth: 30 }));

    throw new Error('oops');
  }

  return validAttributes;
};

export namespace Validation {
  export const run = validate;
  export const schema = SCHEMA;
};
