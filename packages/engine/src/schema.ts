import fs from 'node:fs';
import { argv } from 'node:process';

import Ajv from 'ajv';

import { JSON_SCHEMA_PATH, SERVICE_TYPE } from './constants';

import Project from '@stackmate/engine/core/project-obsolete';
import Registry from '@stackmate/engine/core/registry';
import { PROVIDER, CLOUD_SERVICE_TYPE } from '@stackmate/engine/constants';
import {
  BaseJsonSchema,
  StackmateProject,
  ProviderChoice,
  ServiceTypeChoice,
  JsonSchema,
} from '@stackmate/engine/types';
import { isEmpty } from 'lodash';

type SchemaBranch = keyof Pick<Project, 'state' | 'secrets' | 'stages'>;

/**
 * Returns the corresponding JSON schema structure by configuration branch (eg. state or secrets)
 *
 * @param {SchemaBranch} branch the branch to select
 * @param {BaseJsonSchema} props the properties to assign to the branch
 * @returns {BaseJsonSchema} the schema branch
 */
const getSchemaByBranch = (
  branch: SchemaBranch, props: JsonSchema<{ secrets: object}>,
): BaseJsonSchema => {
  if (branch === 'secrets' || branch === 'state') {
    return {
      required: [branch],
      properties: { [branch]: props },
    };
  }

  return {
    required: ['stages'],
    properties: {
      stages: {
        items: {
          required: ['services'],
          properties: {
            services: {
              items: props,
            },
          },
        },
      },
    },
  };
};

/**
 * Returns the service schema definitions and type discriminations
 * that should be applied into the schema conditionals
 *
 * @param {ProviderChoice} provider the provider whose services we need to get the schema for
 * @returns {Object}
 */
const getServiceSchemaEntries = (provider: ProviderChoice): {
  definitions: { [key: string]: BaseJsonSchema },
  conditions: BaseJsonSchema[],
} => {
  const services = Registry.ofProvider(provider);

  if (isEmpty(services)) {
    throw new Error(`There are no services registered for ${provider}`);
  }

  const definitions: { [path: string]: JsonSchema } = {};
  const conditions: JsonSchema[] = [];

  // Split the service types into the corresponding branch so that
  // we create additional conditions for the services, state and secrets branches
  const branches: Map<SchemaBranch, ServiceTypeChoice[]> = new Map([
    ['state', [SERVICE_TYPE.STATE]],
    ['secrets', [SERVICE_TYPE.VAULT]],
    ['stages', Object.values(CLOUD_SERVICE_TYPE) as ServiceTypeChoice[]],
  ]);

  for (const entry of branches) {
    const [branch, serviceTypes] = entry;

    for (const serviceType of serviceTypes) {
      const service = services.find(s => s.type === serviceType);

      if (!service) {
        continue;
      }

      let typeDiscrimination: { [p: string]: JsonSchema } = {};

      if (branch === 'stages') {
        typeDiscrimination = { type: { const: serviceType } };
      }

      conditions.push({
        if: {
          // The provider is either defined at root level,
          // or is explicitly defined in the service definition
          anyOf: [
            {
              // root provider is defined, nested provider is not
              allOf: [
                {
                  required: ['provider'],
                  properties: {
                    ...typeDiscrimination,
                    provider: { const: provider },
                  },
                },
                // provider at service level is absent
                getSchemaByBranch(branch, {
                  not: { required: ['provider'] },
                  properties: typeDiscrimination,
                }),
              ],
            },
            // Provider is explicitly defined on the service type
            getSchemaByBranch(branch, {
              required: ['provider'],
              properties: {
                ...typeDiscrimination,
                provider: { const: provider },
              },
            }),
          ],
        },
        // In case this condition is true, we should apply another set of conditions
        // discriminated by service type, referencing the corresponding service's schema
        then: getSchemaByBranch(branch, { $ref: service.schemaId }),
      });

      // Add the service definition
      Object.assign(definitions, { [service.schemaId]: service.schema });
    }
  }

  return {
    definitions,
    conditions,
  };
};

/**
 * @returns {StackmateProject.Schema} the schema to use for validation
 */
export const getSchema = (): StackmateProject.Schema => {
  let schema = { ...Project.schema() };

  // Apply the provider services
  Object.values(PROVIDER).forEach(provider => {
    const { definitions, conditions } = getServiceSchemaEntries(provider);

    // Merge the service definitions and conditions
    schema = Object.assign({}, schema, {
      $defs: { ...(schema.$defs || {}), ...definitions },
      allOf: [...(schema.allOf || []), ...conditions],
    });
  });

  return schema;
};

const schema = getSchema();
const ajv = new Ajv();

if (!ajv.validateSchema(schema)) {
  console.error('Schema is invalid', ajv.errors);
  process.exit(1);
}

const [filePath] = argv.slice(2);
const jsonSchemaDest = filePath || JSON_SCHEMA_PATH;

fs.writeFileSync(jsonSchemaDest, JSON.stringify(schema, null, 2));
console.info('JSON schema generated under', jsonSchemaDest);
