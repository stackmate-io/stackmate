import fs from 'node:fs';

import Ajv from 'ajv';
import { isEmpty } from 'lodash';

import { JSON_SCHEMA_PATH, SERVICE_TYPE } from './constants';

import Project from '@stackmate/engine/core/project';
import Registry from '@stackmate/engine/core/registry';
import { PROVIDER } from '@stackmate/engine/constants';
import {
  BaseJsonSchema,
  ProjectConfiguration,
  ProviderChoice,
  ServiceTypeChoice,
} from '@stackmate/engine/types';

type SchemaBranch = 'state' | 'secrets' | 'cloudServices';

/**
 * @param {SchemaBranch} branch the branch to select
 * @param {BaseJsonSchema} props the properties to assign to the branhc
 * @returns {BaseJsonSchema} the schema branch
 */
const getSchemaBranch = (branch: SchemaBranch, props: BaseJsonSchema): BaseJsonSchema => {
  if (branch === 'secrets') {
    return { properties: { secrets: props } }
  }

  if (branch === 'state') {
    return { properties: { state: props } }
  }

  return {
    properties: {
      stages: {
        patternProperties: {
          [Project.keyPattern]: {
            patternProperties: {
              [Project.keyPattern]: props,
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
    ['cloudServices', Object.values(SERVICE_TYPE)],
  ]);

  for (const entry of branches) {
    const [branch, serviceTypes] = entry;
    const typeDiscriminations: BaseJsonSchema[] = [];

    for (const serviceType of serviceTypes) {
      const serviceClass = services.get(serviceType);

      if (!serviceClass) {
        continue;
      }

      // Add the service type discriminations
      typeDiscriminations.push({
        if: { properties: { type: { const: serviceType } } },
        then: { $ref: serviceClass.schemaId },
      });

      // Add the service definition
      Object.assign(definitions, { [serviceClass.schemaId]: serviceClass.schema() });
    }

    if (isEmpty(typeDiscriminations)) {
      continue;
    }

    conditions.push({
      if: {
        // The provider is either defined at root level,
        // or is explicitly defined in the service definition
        anyOf: [
          {
            // root provider is aws, nested provider is not defined
            allOf: [
              { properties: { provider: { const: provider } } },
              getSchemaBranch(branch, { properties: { provider: { const: null } } }),
            ],
          },
          // Provider is explicitly set to aws on the service type
          getSchemaBranch(branch, { properties: { provider: { const: provider } } }),
        ],
      },
      // In case this condition is true, we should apply another set of conditions
      // discriminated by service type, referencing the corresponding service's schema
      then: getSchemaBranch(branch, { allOf: typeDiscriminations }),
    });
  }

  return {
    definitions,
    conditions,
  };
};

/**
 * @returns {StackmateProject.Schema} the schema to use for validation
 */
export const getSchema = (): ProjectConfiguration.Schema => {
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

fs.writeFileSync(JSON_SCHEMA_PATH, JSON.stringify(schema, null, 2));
console.log('JSON schema generated under', JSON_SCHEMA_PATH);
