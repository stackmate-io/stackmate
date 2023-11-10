import { Services } from '@src/index'
import { getSchema, getValidData } from '@src/validation/utils/getSchema'
import { getAjv } from '@src/validation/utils/getAjv'
import type { FuncKeywordDefinition } from 'ajv/dist/types'
import type { ServiceConfiguration } from '@services/registry'

describe('Validation', () => {
  const ajv = getAjv()
  const schema = getSchema()
  let config: ServiceConfiguration[]

  beforeEach(() => {
    config = [
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

  describe('getSchema', () => {
    it('returns a valid schema', () => {
      const ajv = getAjv()
      const schemaId = schema.$id

      if (!schemaId) {
        throw new Error('')
      }

      expect(() => ajv.validateSchema(schema, true)).not.toThrow()
      expect(ajv.errors).toBeNull()
    })

    it('requires that the schema is an array of objects', () => {
      expect(schema).toMatchObject({
        $id: 'stackmate-services-configuration',
        type: 'array',
        minItems: 1,
        items: expect.objectContaining({
          type: 'object',
          required: expect.arrayContaining(['name', 'type', 'provider']),
        }),
      })

      expect(Object.keys(schema.$defs || {})).toEqual(
        expect.arrayContaining(Services.all().map((srv) => srv.schemaId)),
      )
    })
  })

  describe('getValidData', () => {
    it('validates data', () => {
      const valid = getValidData(config, schema)
      expect(valid).toEqual(
        expect.arrayContaining(config.map((cfg) => expect.objectContaining(cfg))),
      )
    })
  })
})
