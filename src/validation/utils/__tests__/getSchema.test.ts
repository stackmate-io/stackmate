import { Registry } from '@src/services/registry'
import { getAjv } from '@src/validation/utils/getAjv'
import { getServicesSchema } from '@src/validation/utils/getServicesSchema'
import type { ServiceAttributes } from '@src/services/registry'
import type { JsonSchema } from '@src/lib/schema'

describe('getSchema', () => {
  let schema: JsonSchema<ServiceAttributes[]>
  beforeAll(() => {
    schema = getServicesSchema()
  })

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
      expect.arrayContaining(Registry.all().map((srv) => srv.schemaId)),
    )
  })
})
