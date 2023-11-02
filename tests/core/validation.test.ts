import { getAjv } from '@core/validation'
import type { FuncKeywordDefinition } from 'ajv/dist/types'

describe('Validation', () => {
  const ajv = getAjv()

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

  /*
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
  */
})
