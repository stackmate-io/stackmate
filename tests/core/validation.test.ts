import { getAjv, getValidData, getSchema } from '@core/validation'
import { validateEnvironment } from 'src/services/utils/validation/validateEnvironment'
import { faker } from '@faker-js/faker'
import { fromPairs, merge } from 'lodash'
import { EnvironmentValidationError } from 'src'
import { ValidationError } from '@lib/errors'
import type { JsonSchema } from '@lib/schema'
import type { FuncKeywordDefinition } from 'ajv/dist/types'
import type { ServiceAttributes, ServiceConfiguration } from '@core/registry'
import type { ServiceEnvironment } from 'src/services/types'

describe('Validation', () => {
  const ajv = getAjv()
  let servicesConfig: ServiceConfiguration[]
  let schema: JsonSchema<ServiceAttributes[]>

  beforeAll(() => {
    schema = getSchema()
  })

  beforeEach(() => {
    servicesConfig = [
      {
        name: 'mysql-database',
        type: 'mysql',
        size: 'db.t3.micro',
        provider: 'aws',
        region: 'eu-central-1',
      },
      {
        name: 'postgresql-database',
        type: 'postgresql',
        provider: 'aws',
        region: 'eu-central-1',
      },
    ]
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
        const invalid = merge([], servicesConfig, [{ links: ['invalid-link'] }])
        expect(() => getValidData(invalid, schema)).toThrow(ValidationError)
      })

      it('proceeds without an error for valid service links', () => {
        const links = ['postgresql-database']
        const withLinks = merge([], servicesConfig, [{ links }])

        const [serviceWithLinks] = getValidData(withLinks, schema)
        expect(serviceWithLinks).toMatchObject({ links: expect.arrayContaining(links) })
      })
    })

    describe('serviceProfile', () => {
      it('raises an error when the service profile is invalid', () => {
        const invalid = merge([], servicesConfig, [{ profile: 'invalid-profile' }])
        expect(() => getValidData(invalid, schema)).toThrow(ValidationError)
      })

      it('proceeds without errors for valid service profiles', () => {
        const withProfile = merge([], servicesConfig, [{ profile: 'default' }])

        const [serviceWithProfile] = getValidData(withProfile, schema)
        expect(serviceWithProfile).toMatchObject({
          overrides: {},
          profile: 'default',
        })
      })
    })

    describe('serviceProfileOverrides', () => {
      it('raises an error when the overrides does not contain keys defined by the profile', () => {
        const invalid = merge([], servicesConfig, [
          { overrides: { something: true, invalid: true } },
        ])

        expect(() => getValidData(invalid, schema)).toThrow(ValidationError)
      })

      it('proceeds without an error when the overrides are valid', () => {
        const overrides = { instance: {}, params: {} }
        const withOverrides = merge([], servicesConfig, [{ overrides }])

        const [serviceWithOverrides] = getValidData(withOverrides, schema)
        expect(serviceWithOverrides).toMatchObject({ overrides })
      })
    })

    describe('isIpOrCidr', () => {
      it('raises an error when an invalid IP is used', () => {
        const invalid = merge([], servicesConfig, [{ externalLinks: ['abcdefg'] }])
        expect(() => getValidData(invalid, schema)).toThrow(ValidationError)
      })

      it('proceeds without an error when the IPs used are valid', () => {
        const externalLinks = ['192.168.1.1', '192.168.29.32']
        const withIPs = merge([], servicesConfig, [{ externalLinks }])

        const [serviceWithExtraLinks] = getValidData(withIPs, schema)
        expect(serviceWithExtraLinks).toMatchObject({ externalLinks })
      })

      it('proceeds without an error when the CIDR used is valid', () => {
        const externalLinks = ['192.168.1.1/24', '192.168.29.32/32']
        const withCidr = merge([], servicesConfig, [{ externalLinks }])

        const [serviceWithExtraLinks] = getValidData(withCidr, schema)
        expect(serviceWithExtraLinks).toMatchObject({ externalLinks })
      })
    })
  })
})
