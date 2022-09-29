import { FuncKeywordDefinition } from 'ajv/dist/types';

import { JSON_SCHEMA_KEY } from '@stackmate/engine/constants';
import {
  getAjv, loadJsonSchema, validateProject, validateServiceLinks, validateServiceProfile, validateServiceProfileOverrides,
} from '@stackmate/engine/core/validation';
import { AwsMySQLAttributes } from '@stackmate/engine/providers/aws/services/database';

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
    it('throws errors for invalid data', () => {
      const service: Partial<AwsMySQLAttributes> = {
        name: 'otinaeinai',
        type: 'mysql',
        storage: -1,
        size: 'pp.tt.ee',
      };

      validateProject({
        name: 'a', provider: 'aws', region: 'abc-123',
        stages: [{ name: 'bhkc', services: [service] }],
      });
    });
  });
});
