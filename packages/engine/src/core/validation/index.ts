import fs from 'node:fs';

import Ajv from 'ajv';
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
