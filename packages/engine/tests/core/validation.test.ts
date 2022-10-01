import { fail } from 'node:assert';
import { FuncKeywordDefinition } from 'ajv/dist/types';

import { Registry } from '@stackmate/engine/core/registry';
import { DEFAULT_PROFILE_NAME, DEFAULT_SERVICE_STORAGE, JSON_SCHEMA_KEY } from '@stackmate/engine/constants';
import { ProjectConfiguration } from '@stackmate/engine/core/project';
import { BaseServiceAttributes } from '@stackmate/engine/core/service';
import { AwsMySQLAttributes } from '@stackmate/engine/providers/aws/services/database';
import {
  getAjv, loadJsonSchema, validate, validateProject, validateServiceLinks,
  validateServiceProfile, validateServiceProfileOverrides, ValidationError,
} from '@stackmate/engine/core/validation';
import { DEFAULT_RDS_INSTANCE_SIZE } from '@stackmate/engine/providers/aws/constants';

describe('Validation', () => {
  const ajv = getAjv();

  beforeEach(() => {
    ajv.removeSchema(JSON_SCHEMA_KEY);
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
      expect((serviceLinks as FuncKeywordDefinition).validate).toEqual(validateServiceLinks);
    });

    it('returns an Ajv instance with serviceProfile keyword in place', () => {
      const serviceProfile = ajv.getKeyword('serviceProfile');
      expect(serviceProfile).not.toBe(false);
      expect((serviceProfile as FuncKeywordDefinition).validate).toEqual(validateServiceProfile);
    });

    it('returns an Ajv instance with serviceProfileOverrides keyword in place', () => {
      const overrides = ajv.getKeyword('serviceProfileOverrides');
      expect(overrides).not.toBe(false);
      expect((overrides as FuncKeywordDefinition).validate).toEqual(
        validateServiceProfileOverrides,
      );
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
          path: '', message: 'You need to set a name for the project',
        }, {
          path: '', message: 'You need to set a default provider for the project',
        }, {
          path: '', message: 'You need to set a default region for the project',
        }, {
          path: '', message: 'You should define at least one stage to deploy',
        }]),
      );
    });

    it('raises an error when the name attribute is less than 3 characters', () => {
      const { errors } = getValidationError({ name: 'ab' });
      expect(errors).toEqual(
        expect.arrayContaining([{
          path: 'name',
          message: 'The "name" property should be more than 3 characters',
        }])
      );
    });

    it('raises an error when the name attribute doesn’t match the regex pattern', () => {
      const { errors } = getValidationError({ name: 'this # is # invalid' });
      expect(errors).toEqual(
        expect.arrayContaining([{
          path: 'name',
          message: 'The "name" property should consist of letters, numbers, dashes, dots, underscores and forward slashes',
        }])
      );
    });

    it('raises an error when the provider is not in the list', () => {
      const { errors } = getValidationError({ provider: 'INVALID' });
      expect(errors).toEqual(
        expect.arrayContaining([{
          path: 'provider',
          message: expect.stringContaining('The provider is invalid, available choices'),
        }])
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
        message: expect.stringContaining('Invalid state provider, available options are'),
      }]))
    });

    it('raises an error when the secrets configuration is invalid', () => {
      const { errors } = getValidationError({ secrets: { provider: 'INVALID' } });
      expect(errors).toEqual(expect.arrayContaining([{
        path: 'secrets.provider',
        message: expect.stringContaining('Invalid secrets provider, available options are'),
      }]))
    });

    it('returns the validated data with defaults, for a valid project configuration', () => {
      const service: BaseServiceAttributes = {
        name: 'my-database',
        provider: 'aws',
        region: 'eu-central-1',
        type: 'mysql',
      };

      const stage = {
        name: 'my-awesome-stage',
        services: [service],
      };

      const config: ProjectConfiguration = {
        name: 'my-awesome-project',
        provider: 'aws',
        region: 'eu-central-1',
        stages: [stage],
      };

      const validated = validateProject(config);
      expect(validated).toBeInstanceOf(Object);

      // make sure the default values have been applied
      expect(validated).toMatchObject({
        ...config,
        stages: [{
          ...stage,
          services: [{
            ...service,
            provider: 'aws',
            region: 'eu-central-1',
          }],
        }],
      })
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
});
