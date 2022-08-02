import fs from 'node:fs';
import { argv } from 'node:process';

import Ajv from 'ajv';

import { JSON_SCHEMA_PATH, SERVICE_TYPE } from './constants';

import Project from '@stackmate/engine/core/project';
import Registry from '@stackmate/engine/core/registry';
import { PROVIDER, CLOUD_SERVICE_TYPE } from '@stackmate/engine/constants';
import {
  BaseJsonSchema,
  StackmateProject,
  ProviderChoice,
  ServiceTypeChoice,
} from '@stackmate/engine/types';

type SchemaBranch = 'state' | 'secrets' | 'cloudServices';

/**
 * @param {SchemaBranch} branch the branch to select
 * @param {BaseJsonSchema} props the properties to assign to the branch
 * @returns {BaseJsonSchema} the schema branch
 */
const getSchemaBranch = (branch: SchemaBranch, props: BaseJsonSchema): BaseJsonSchema => {
  if (branch === 'secrets') {
    return {
      required: ['secrets'],
      properties: { secrets: props },
    };
  }

  if (branch === 'state') {
    return {
      required: ['state'],
      properties: { state: props },
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
  const services = Registry.items.get(provider);

  if (!services?.size) {
    throw new Error(`There are no services registered for ${provider}`);
  }

  const definitions: { [path: string]: BaseJsonSchema } = {};
  const conditions: BaseJsonSchema[] = [];

  // Split the service types into the corresponding branch so that
  // we create additional conditions for the services, state and secrets branches
  const branches: Map<SchemaBranch, ServiceTypeChoice[]> = new Map([
    ['state', [SERVICE_TYPE.STATE]],
    ['secrets', [SERVICE_TYPE.VAULT]],
    ['cloudServices', Object.values(CLOUD_SERVICE_TYPE) as ServiceTypeChoice[]],
  ]);

  for (const entry of branches) {
    const [branch, serviceTypes] = entry;

    for (const serviceType of serviceTypes) {
      const serviceClass = services.get(serviceType);

      if (!serviceClass) {
        continue;
      }

      let typeDiscrimination: { [p: string]: BaseJsonSchema } = {};

      if (branch === 'cloudServices') {
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
                getSchemaBranch(branch, {
                  not: { required: ['provider'] },
                  properties: typeDiscrimination,
                }),
              ],
            },
            // Provider is explicitly defined on the service type
            getSchemaBranch(branch, {
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
        then: getSchemaBranch(branch, { $ref: serviceClass.schemaId }),
      });

      // Add the service definition
      Object.assign(definitions, { [serviceClass.schemaId]: serviceClass.schema() });
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
