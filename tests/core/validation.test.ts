import { fail } from 'node:assert'
import { faker } from '@faker-js/faker'
import { fromPairs, merge } from 'lodash'
import type { FuncKeywordDefinition } from 'ajv/dist/types'

import { Registry } from '@core/registry'
import type { ServiceEnvironment } from '@core/service/core'
import { DEFAULT_RDS_INSTANCE_SIZE } from '@providers/aws/constants'
import {
  DEFAULT_PROFILE_NAME,
  DEFAULT_SERVICE_STORAGE,
  JSON_SCHEMA_KEY,
  JSON_SCHEMA_ROOT,
} from '@constants'
import type { ProjectConfiguration } from '@core/project'
import type { AwsMySQLAttributes } from '@providers/aws/services/database'
import { EnvironmentValidationError, ValidationError } from '@lib/errors'
import {
  getAjv,
  loadJsonSchema,
  validate,
  validateEnvironment,
  validateProject,
  validateProperty,
} from '@core/validation'

describe('Validation', () => {
  const ajv = getAjv()
  let projectConfig: ProjectConfiguration

  beforeEach(() => {
    ajv.removeSchema(JSON_SCHEMA_KEY)

    projectConfig = {
      name: 'my-super-fun-project',
      provider: 'aws',
      region: 'eu-central-1',
      monitoring: {
        emails: [faker.internet.email()],
      },
      services: [
        {
          name: 'mysql-database',
          type: 'mysql',
          size: 'db.t3.micro',
        },
        {
          name: 'postgresql-database',
          type: 'postgresql',
        },
      ],
    }
  })

  describe('getAjv', () => {
    it('returns an Ajv instance with serviceLinks keyword in place', () => {
      const serviceLinks = ajv.getKeyword('serviceLinks')
      expect(serviceLinks).not.toBe(false)
      expect((serviceLinks as FuncKeywordDefinition).compile).toBeInstanceOf(Function)
    })

    it('returns an Ajv instance with isIpOrCidr keyword in place', () => {
      const ipOrCidr = ajv.getKeyword('isIpOrCidr')
      expect(ipOrCidr).not.toBe(false)
      expect((ipOrCidr as FuncKeywordDefinition).compile).toBeInstanceOf(Function)
    })

    it('returns an Ajv instance with serviceProfile keyword in place', () => {
      const serviceProfile = ajv.getKeyword('serviceProfile')
      expect(serviceProfile).not.toBe(false)
      expect((serviceProfile as FuncKeywordDefinition).compile).toBeInstanceOf(Function)
    })

    it('returns an Ajv instance with serviceProfileOverrides keyword in place', () => {
      const overrides = ajv.getKeyword('serviceProfileOverrides')
      expect(overrides).not.toBe(false)
      expect((overrides as FuncKeywordDefinition).compile).toBeInstanceOf(Function)
    })
  })

  describe('loadJsonSchema', () => {
    it('loads the schema', () => {
      expect(ajv.schemas[JSON_SCHEMA_KEY]).toBeUndefined()
      loadJsonSchema(ajv)

      expect(ajv.schemas[JSON_SCHEMA_KEY]).not.toBeUndefined()
      const schema = ajv.getSchema(JSON_SCHEMA_KEY)
      expect(typeof schema === 'function').toBe(true)
    })
  })

  describe('validateProject', () => {
    const getValidationError = (config: object): ValidationError => {
      try {
        validateProject(config)
      } catch (err) {
        if (!(err instanceof ValidationError)) {
          fail('Expected an instance of ValidationError but got a different tyoe of error')
        }

        return err
      }

      fail('Expected validate function to raise an error but got nothing instead')
    }

    it('raises an error when the root configuration is invalid', () => {
      const error = getValidationError({})
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.errors).toEqual(
        expect.arrayContaining([
          {
            path: '',
            message: expect.stringContaining('You need to set a name for the project'),
          },
          {
            path: '',
            message: expect.stringContaining('You need to set a default provider'),
          },
          {
            path: '',
            message: expect.stringContaining('You need to set a default region'),
          },
          {
            path: '',
            message: expect.stringContaining('You should define at least one service'),
          },
        ]),
      )
    })

    it('raises an error when the project name is less than 3 characters', () => {
      const { errors } = getValidationError({ name: 'ab' })
      expect(errors).toEqual(
        expect.arrayContaining([
          {
            path: 'name',
            message: 'The "name" property should be more than 3 characters',
          },
        ]),
      )
    })

    it('raises an error when the project name doesn’t match the regex pattern', () => {
      const { errors } = getValidationError({ name: 'this # is # invalid' })
      expect(errors).toEqual(
        expect.arrayContaining([
          {
            path: 'name',
            message:
              'The "name" property should consist of letters, numbers, dashes, dots, underscores and forward slashes',
          },
        ]),
      )
    })

    it('raises an error when the provider is not in the list', () => {
      const { errors } = getValidationError({ provider: 'INVALID' })
      expect(errors).toEqual(
        expect.arrayContaining([
          {
            path: 'provider',
            message: expect.stringContaining('The provider is invalid, available choices'),
          },
        ]),
      )
    })

    it('raises an error when the region is not in the list', () => {
      const { errors } = getValidationError({ region: 'INVALID' })
      expect(errors).toEqual(
        expect.arrayContaining([
          {
            path: 'region',
            message: expect.stringContaining('The region is invalid. Available options are'),
          },
        ]),
      )
    })

    it('raises an error when the project doesn’t contain any services', () => {
      const { errors } = getValidationError({ services: [] })
      expect(errors).toEqual(
        expect.arrayContaining([
          {
            path: 'services',
            message: expect.stringContaining('You should define at least one service'),
          },
        ]),
      )
    })

    it('raises an error when the services key contains empty objects', () => {
      const { errors } = getValidationError({ services: [{}] })

      expect(errors).toEqual(
        expect.arrayContaining([
          {
            path: 'services.0',
            message: expect.stringContaining('Every service should feature a "name" property'),
          },
          {
            path: 'services.0',
            message: expect.stringContaining('Every service should feature a "type" property'),
          },
        ]),
      )
    })

    it('raises an error when the state configuration is invalid', () => {
      const { errors } = getValidationError({ state: { provider: 'INVALID' } })
      expect(errors).toEqual(
        expect.arrayContaining([
          {
            path: 'state.provider',
            message: expect.stringContaining('The provider is invalid, available choices are'),
          },
        ]),
      )
    })

    it('raises an error when the secrets configuration is invalid', () => {
      const { errors } = getValidationError({ secrets: { provider: 'INVALID' } })
      expect(errors).toEqual(
        expect.arrayContaining([
          {
            path: 'secrets.provider',
            message: expect.stringContaining('The provider is invalid, available choices are'),
          },
        ]),
      )
    })

    it('returns the validated data with defaults, for a valid project configuration', () => {
      const validated = validateProject(projectConfig)
      expect(validated).toBeInstanceOf(Object)

      // make sure the default values have been applied
      expect(validated).toMatchObject({
        ...projectConfig,
        services: projectConfig.services!.map((service) => ({
          ...service,
          provider: 'aws',
          region: 'eu-central-1',
        })),
      })
    })
  })

  describe('validate', () => {
    it('validates a service and applies defaults', () => {
      const service = Registry.get('aws', 'mysql')
      const config: Partial<AwsMySQLAttributes> = {
        name: 'my-database-service',
        provider: 'aws',
        type: 'mysql',
        region: 'eu-central-1',
      }

      const validated = validate(service.schemaId, config, { useDefaults: true })
      expect(validated).toBeInstanceOf(Object)
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
      })
    })
  })

  describe('validateProperty', () => {
    it('throws a validation error for an invalid property', () => {
      expect(() => validateProperty('name', 'this is invalid because of all the spaces')).toThrow(
        ValidationError,
      )
    })

    it('does not throw for a valid name', () => {
      expect(() => validateProperty('name', 'my-project-name')).not.toThrow()
    })

    it('validates a nested property', () => {
      expect(() => validateProperty('services/items/properties/name', 'my-service')).not.toThrow()
    })
  })

  describe('validateEnvironment', () => {
    const vars: ServiceEnvironment[] = []

    beforeEach(() => {
      vars.push(
        {
          name: faker.lorem.word().toUpperCase(),
          description: faker.lorem.sentence(),
          required: true,
        },
        {
          name: faker.lorem.word().toUpperCase(),
          description: faker.lorem.sentence(),
          required: false,
        },
      )
    })

    it('raises an error when there are required environment variables missing', () => {
      expect(() => validateEnvironment(vars)).toThrow(EnvironmentValidationError)
    })

    it('does not raise an error when all required variables are present', () => {
      const envWithRequiredParams = fromPairs(
        vars.filter((envVar) => envVar.required).map((envVar) => [envVar.name, faker.lorem.word()]),
      )

      expect(() => validateEnvironment(vars, envWithRequiredParams)).not.toThrow()
    })
  })

  describe('custom validators', () => {
    describe('serviceLinks', () => {
      it('raises an error when the service links contain invalid entries', () => {
        const invalid = merge({}, projectConfig, {
          services: [{ links: ['invalid-link'] }],
        })

        expect(() => validate(JSON_SCHEMA_ROOT, invalid)).toThrow(ValidationError)
      })

      it('proceeds without an error for valid service links', () => {
        const links = ['postgresql-database']
        const withLinks = merge({}, projectConfig, { services: [{ links }] })

        const validated = validate(JSON_SCHEMA_ROOT, withLinks)
        expect(validated).toMatchObject(projectConfig)

        const {
          services: [serviceWithLinks],
        } = validated

        expect(serviceWithLinks).toMatchObject({ links: expect.arrayContaining(links) })
      })
    })

    describe('serviceProfile', () => {
      it('raises an error when the service profile is invalid', () => {
        const invalid = merge({}, projectConfig, {
          services: [{ profile: 'invalid-profile' }],
        })

        expect(() => validate(JSON_SCHEMA_ROOT, invalid)).toThrow(ValidationError)
      })

      it('proceeds without errors for valid service profiles', () => {
        const withProfile = merge({}, projectConfig, {
          services: [{ profile: 'default' }],
        })

        const validated = validate(JSON_SCHEMA_ROOT, withProfile)

        const {
          services: [serviceWithProfile],
        } = validated
        expect(serviceWithProfile).toMatchObject({
          overrides: {},
          profile: 'default',
        })
      })
    })

    describe('serviceProfileOverrides', () => {
      it('raises an error when the overrides does not contain keys defined by the profile', () => {
        const invalid = merge({}, projectConfig, {
          services: [{ overrides: { something: true, invalid: true } }],
        })

        expect(() => validate(JSON_SCHEMA_ROOT, invalid)).toThrow(ValidationError)
      })

      it('proceeds without an error when the overrides are valid', () => {
        const overrides = { instance: {}, params: {} }
        const withOverrides = merge({}, projectConfig, { services: [{ overrides }] })

        const validated = validate(JSON_SCHEMA_ROOT, withOverrides)

        const {
          services: [serviceWithOverrides],
        } = validated
        expect(serviceWithOverrides).toMatchObject({ overrides })
      })
    })

    describe('isIpOrCidr', () => {
      it('raises an error when an invalid IP is used', () => {
        const invalid = merge({}, projectConfig, {
          services: [{ externalLinks: ['abcdefg'] }],
        })

        expect(() => validate(JSON_SCHEMA_ROOT, invalid)).toThrow(ValidationError)
      })

      it('proceeds without an error when the IPs used are valid', () => {
        const externalLinks = ['192.168.1.1', '192.168.29.32']
        const withCidr = merge({}, projectConfig, {
          services: [{ externalLinks }],
        })

        const validated = validate(JSON_SCHEMA_ROOT, withCidr)

        const {
          services: [serviceWithOverrides],
        } = validated

        expect(serviceWithOverrides).toMatchObject({ externalLinks })
      })

      it('proceeds without an error when the CIDR used is valid', () => {
        const externalLinks = ['192.168.1.1/24', '192.168.29.32/32']
        const withCidr = merge({}, projectConfig, {
          services: [{ externalLinks }],
        })

        const validated = validate(JSON_SCHEMA_ROOT, withCidr)

        const {
          services: [serviceWithOverrides],
        } = validated
        expect(serviceWithOverrides).toMatchObject({ externalLinks })
      })
    })
  })
})
