import fs from 'node:fs';

import Ajv, { AnySchemaObject } from 'ajv';
import { difference, get, isEmpty } from 'lodash';
import { DataValidationCxt } from 'ajv/dist/types';
import addFormats from 'ajv-formats';
import addErrors from 'ajv-errors';

import { JSON_SCHEMA_PATH } from '@stackmate/engine/constants';
import { EntityAttributes, Project as StackmateProject } from '@stackmate/engine/types';

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
    message() {
      return 'Invalid service links defined';
    }
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
