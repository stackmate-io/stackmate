import fs from 'node:fs';
import { inspect } from 'node:util';
import { argv } from 'node:process';

import Ajv from 'ajv';
import { JSON_SCHEMA_PATH } from '@stackmate/engine/constants';
import { getProjectSchema } from '@stackmate/engine/core/project';

const schema = getProjectSchema();
const ajv = new Ajv();

if (!ajv.validateSchema(schema)) {
  console.error('Schema is invalid', inspect(ajv.errors, { depth: 20 }));
  process.exit(1);
}

const [filePath] = argv.slice(2);
const jsonSchemaDest = filePath || JSON_SCHEMA_PATH;

fs.writeFileSync(jsonSchemaDest, JSON.stringify(schema, null, 2));
console.info('JSON schema generated under', jsonSchemaDest);
