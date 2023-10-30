import { fail } from 'node:assert';
import { faker } from '@faker-js/faker';
import { fromPairs, merge } from 'lodash';
import { FuncKeywordDefinition } from 'ajv/dist/types';

import { Registry } from '@stackmate/engine/core/registry';
import { ServiceEnvironment } from '@stackmate/engine/core/service/core';
import { DEFAULT_RDS_INSTANCE_SIZE } from '@stackmate/engine/providers/aws/constants';
import { DEFAULT_PROFILE_NAME, DEFAULT_SERVICE_STORAGE, JSON_SCHEMA_KEY, JSON_SCHEMA_ROOT } from '@stackmate/engine/constants';
import { ProjectConfiguration } from '@stackmate/engine/core/project';
import { AwsMySQLAttributes } from '@stackmate/engine/providers/aws/services/database';
import { EnvironmentValidationError, ValidationError } from '@stackmate/engine/lib/errors';
import {
  getAjv, loadJsonSchema, validate, validateEnvironment, validateProject, validateProperty,
} from '@stackmate/engine/core/validation';

describe('Validation', () => {
  const ajv = getAjv();
  let projectConfig: ProjectConfiguration;

  beforeEach(() => {
    ajv.removeSchema(JSON_SCHEMA_KEY);

    projectConfig = {
      name: 'my-super-fun-project',
      provider: 'aws',
      region: 'eu-central-1',
      monitoring: {
        emails: [faker.internet.email()],
      },
      stages: [{
        name: 'production',
        services: [{
          name: 'mysql-database',
          type: 'mysql',
          size: 'db.t3.micro'
        }, {
          name: 'postgresql-database',
          type: 'postgresql',
        }],
      }],
    };
  });

  describe('getAjv', () => {
    it('returns an Ajv instance with the isIncludedInConfigGeneration in place', () => {
      const isIncludedInConfigGeneration = ajv.getKeyword('isIncludedInConfigGeneration');
      expect(isIncludedInConfigGeneration).not.toBe(false);
    });

    it('returns an Ajv instance with the serviceConfigGenerationTemplate in place', () => {
      const serviceConfigGenerationTemplate = ajv.getKeyword('serviceConfigGenerationTemplate');
      expect(serviceConfigGenerationTemplate).not.toBe(false);
    });

    it('returns an Ajv instance with serviceLinks keyword in place', () => {
      const serviceLinks = ajv.getKeyword('serviceLinks');
      expect(serviceLinks).not.toBe(false);
      expect((serviceLinks as FuncKeywordDefinition).compile).toBeInstanceOf(Function);
    });

    it('returns an Ajv instance with isIpOrCidr keyword in place', () => {
      const ipOrCidr = ajv.getKeyword('isIpOrCidr');
      expect(ipOrCidr).not.toBe(false);
      expect((ipOrCidr as FuncKeywordDefinition).compile).toBeInstanceOf(Function);
    });

    it('returns an Ajv instance with serviceProfile keyword in place', () => {
      const serviceProfile = ajv.getKeyword('serviceProfile');
      expect(serviceProfile).not.toBe(false);
      expect((serviceProfile as FuncKeywordDefinition).compile).toBeInstanceOf(Function);
    });

    it('returns an Ajv instance with serviceProfileOverrides keyword in place', () => {
      const overrides = ajv.getKeyword('serviceProfileOverrides');
      expect(overrides).not.toBe(false);
      expect((overrides as FuncKeywordDefinition).compile).toBeInstanceOf(Function);
    });

    it('returns an Ajv instance with no-op keyword isIncludedInConfigGeneration', () => {
      const overrides = ajv.getKeyword('isIncludedInConfigGeneration');
      expect(overrides).not.toBe(false);
      expect((overrides as FuncKeywordDefinition).compile).toBeUndefined();
      expect((overrides as FuncKeywordDefinition).validate).toBeUndefined();
    });

    it('returns an Ajv instance with no-op keyword serviceConfigGenerationTemplate', () => {
      const overrides = ajv.getKeyword('serviceConfigGenerationTemplate');
      expect(overrides).not.toBe(false);
      expect((overrides as FuncKeywordDefinition).compile).toBeUndefined();
      expect((overrides as FuncKeywordDefinition).validate).toBeUndefined();
    });
  });

  describe('loadJsonSchema', () => {
    it('loads the schema', () => {
      expect(ajv.schemas[JSON_SCHEMA_KEY]).toBeUndefined();
      loadJsonSchema(ajv);

      expect(ajv.schemas[JSON_SCHEMA_KEY]).not.toBeUndefined();
      const schema = ajv.getSchema(JSON_SCHEMA_KEY);
      expect(typeof schema === 'function').toBe(true);
    });
  });

  describe('validateProject', () => {
    const getValidationError = (config: object): ValidationError => {
      try {
        validateProject(config);
      } catch (err) {
        if (!(err instanceof ValidationError)) {
          fail('Expected an instance of ValidationError but got a different tyoe of error');
        }

        return err;
      }

      fail('Expected validate function to raise an error but got nothing instead');
    };

    it('raises an error when the root configuration is invalid', () => {
      const error = getValidationError({});
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.errors).toEqual(
        expect.arrayContaining([{
          path: '', message: expect.stringContaining('You need to set a name for the project'),
        }, {
          path: '', message: expect.stringContaining('You need to set a default provider'),
        }, {
          path: '', message: expect.stringContaining('You need to set a default region'),
        }, {
          path: '', message: expect.stringContaining('You should define at least one stage'),
        }]),
      );
    });

    it('raises an error when the project name is less than 3 characters', () => {
      const { errors } = getValidationError({ name: 'ab' });
      expect(errors).toEqual(
        expect.arrayContaining([{
          path: 'name',
          message: 'The "name" property should be more than 3 characters',
        }]),
      );
    });

    it('raises an error when the project name doesn’t match the regex pattern', () => {
      const { errors } = getValidationError({ name: 'this # is # invalid' });
      expect(errors).toEqual(
        expect.arrayContaining([{
          path: 'name',
          message: 'The "name" property should consist of letters, numbers, dashes, dots, underscores and forward slashes',
        }]),
      );
    });

    it('raises an error when the provider is not in the list', () => {
      const { errors } = getValidationError({ provider: 'INVALID' });
      expect(errors).toEqual(
        expect.arrayContaining([{
          path: 'provider',
          message: expect.stringContaining('The provider is invalid, available choices'),
        }]),
      );
    });

    it('raises an error when the region is not in the list', () => {
      const { errors } = getValidationError({ region: 'INVALID' });
      expect(errors).toEqual(expect.arrayContaining([{
        path: 'region',
        message: expect.stringContaining('The region is invalid. Available options are'),
      }]));
    });

    it('raises an error when the stages don’t contain services', () => {
      const { errors } = getValidationError({ stages: [] });
      expect(errors).toEqual(expect.arrayContaining([{
        path: 'stages',
        message: expect.stringContaining('You should define at least one stage'),
      }]));
    });

    it('raises an error when the stage is an empty object', () => {
      const { errors } = getValidationError({ stages: [{}] });
      expect(errors).toEqual(expect.arrayContaining([{
        path: 'stages.0',
        message: expect.stringContaining('You should define at least one service or a source stage to copy from'),
      }, {
        path: 'stages.0',
        message: expect.stringContaining('You should define a name for the stage'),
      }]));
    });

    it('raises an error when the state configuration is invalid', () => {
      const { errors } = getValidationError({ state: { provider: 'INVALID' } });
      expect(errors).toEqual(expect.arrayContaining([{
        path: 'state.provider',
        message: expect.stringContaining('The provider is invalid, available choices are'),
      }]));
    });

    it('raises an error when the secrets configuration is invalid', () => {
      const { errors } = getValidationError({ secrets: { provider: 'INVALID' } });
      expect(errors).toEqual(expect.arrayContaining([{
        path: 'secrets.provider',
        message: expect.stringContaining('The provider is invalid, available choices are'),
      }]));
    });

    it('returns the validated data with defaults, for a valid project configuration', () => {
      const validated = validateProject(projectConfig);
      expect(validated).toBeInstanceOf(Object);

      // make sure the default values have been applied
      expect(validated).toMatchObject({
        ...projectConfig,
        stages: projectConfig.stages!.map(stage => ({
          ...stage,
          services: stage.services!.map(service => ({
            ...service,
            provider: 'aws',
            region: 'eu-central-1',
          })),
        })),
      });
    });
  });

  describe('validate', () => {
    it('validates a service and applies defaults', () => {
      const service = Registry.get('aws', 'mysql');
      const config: Partial<AwsMySQLAttributes> = {
        name: 'my-database-service',
        provider: 'aws',
        type: 'mysql',
        region: 'eu-central-1',
      };

      const validated = validate(service.schemaId, config, { useDefaults: true });
      expect(validated).toBeInstanceOf(Object);
      expect(validated).toMatchObject({
        ...config,
        size: DEFAULT_RDS_INSTANCE_SIZE,
        engine: 'mysql',
        nodes: 1,
        port: 3306,
        profile: DEFAULT_PROFILE_NAME,
        overrides: {},
        storage: DEFAULT_SERVICE_STORAGE,
        version: '8.0',
      });
    });
  });

  describe('validateProperty', () => {
    it('throws a validation error for an invalid property', () => {
      expect(
        () => validateProperty('name', 'this is invalid because of all the spaces'),
      ).toThrow(ValidationError);
    });

    it('does not throw for a valid name', () => {
      expect(() => validateProperty('name', 'my-project-name')).not.toThrow();
    });

    it('validates a nested property', () => {
      expect(() => validateProperty('stages/items/properties/name', 'my-stage-name')).not.toThrow();
    });
  });

  describe('validateEnvironment', () => {
    const vars: ServiceEnvironment[] = [];

    beforeEach(() => {
      vars.push({
        name: faker.lorem.word().toUpperCase(),
        description: faker.lorem.sentence(),
        required: true,
      }, {
        name: faker.lorem.word().toUpperCase(),
        description: faker.lorem.sentence(),
        required: false,
      });
    });

    it('raises an error when there are required environment variables missing', () => {
      expect(() => validateEnvironment(vars)).toThrow(EnvironmentValidationError);
    });

    it('does not raise an error when all required variables are present', () => {
      const envWithRequiredParams = fromPairs(vars.filter(
        (envVar) => envVar.required,
      ).map(
        (envVar) => [envVar.name, faker.lorem.word()]),
      );

      expect(() => validateEnvironment(vars, envWithRequiredParams)).not.toThrow();
    });
  });

  describe('custom validators', () => {
    describe('serviceLinks', () => {
      it('raises an error when the service links contain invalid entries', () => {
        const invalid = merge({}, projectConfig, {
          stages: [{ services: [{ links: ['invalid-link'] }] }],
        });

        expect(() => validate(JSON_SCHEMA_ROOT, invalid)).toThrow(ValidationError);
      });

      it('proceeds without an error for valid service links', () => {
        const links = ['postgresql-database'];
        const withLinks = merge({}, projectConfig, { stages: [{ services: [{ links }] }] });

        const validated = validate(JSON_SCHEMA_ROOT, withLinks);
        expect(validated).toMatchObject(projectConfig);

        const { stages: [{ services: [serviceWithLinks] }] } = validated;
        expect(serviceWithLinks).toMatchObject({ links: expect.arrayContaining(links) });
      });
    });

    describe('serviceProfile', () => {
      it('raises an error when the service profile is invalid', () => {
        const invalid = merge({}, projectConfig, {
          stages: [{ services: [{ profile: 'invalid-profile' }] }],
        });

        expect(() => validate(JSON_SCHEMA_ROOT, invalid)).toThrow(ValidationError);
      });

      it('proceeds without errors for valid service profiles', () => {
        const withProfile = merge({}, projectConfig, {
          stages: [{ services: [{ profile: 'default' }] }],
        });

        const validated = validate(JSON_SCHEMA_ROOT, withProfile);

        const { stages: [{ services: [serviceWithProfile] }] } = validated;
        expect(serviceWithProfile).toMatchObject({
          overrides: {},
          profile: 'default',
        });
      });
    });

    describe('serviceProfileOverrides', () => {
      it('raises an error when the overrides does not contain keys defined by the profile', () => {
        const invalid = merge({}, projectConfig, {
          stages: [{ services: [{ overrides: { something: true, invalid: true } }] }],
        });

        expect(() => validate(JSON_SCHEMA_ROOT, invalid)).toThrow(ValidationError);
      });

      it('proceeds without an error when the overrides are valid', () => {
        const overrides = { instance: {}, params: {} };
        const withOverrides = merge({}, projectConfig, { stages: [{ services: [{ overrides }] }] });

        const validated = validate(JSON_SCHEMA_ROOT, withOverrides);

        const { stages: [{ services: [serviceWithOverrides] }] } = validated;
        expect(serviceWithOverrides).toMatchObject({ overrides });
      });
    });

    describe('isIpOrCidr', () => {
      it('raises an error when an invalid IP is used', () => {
        const invalid = merge({}, projectConfig, {
          stages: [{ services: [{ externalLinks: ['abcdefg'] }] }],
        });

        expect(() => validate(JSON_SCHEMA_ROOT, invalid)).toThrow(ValidationError);
      });

      it('proceeds without an error when the IPs used are valid', () => {
        const externalLinks = ['192.168.1.1', '192.168.29.32'];
        const withCidr = merge({}, projectConfig, {
          stages: [{ services: [{ externalLinks }] }],
        });

        const validated = validate(JSON_SCHEMA_ROOT, withCidr);

        const { stages: [{ services: [serviceWithOverrides] }] } = validated;
        expect(serviceWithOverrides).toMatchObject({ externalLinks });
      });

      it('proceeds without an error when the CIDR used is valid', () => {
        const externalLinks = ['192.168.1.1/24', '192.168.29.32/32'];
        const withCidr = merge({}, projectConfig, {
          stages: [{ services: [{ externalLinks }] }],
        });

        const validated = validate(JSON_SCHEMA_ROOT, withCidr);

        const { stages: [{ services: [serviceWithOverrides] }] } = validated;
        expect(serviceWithOverrides).toMatchObject({ externalLinks });
      });
    });
  });
});
