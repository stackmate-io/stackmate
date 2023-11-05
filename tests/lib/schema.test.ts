import { mergeSchemas } from '@src/lib/schema'
import type { JsonSchema } from '@src/lib/schema'

type Subject = {
  a: string
  b: number
}

type ExtSubject = Subject & {
  extend: boolean
}

describe('mergeSchemas', () => {
  let schema1: JsonSchema<Subject>
  let schema2: JsonSchema<ExtSubject>

  beforeEach(() => {
    schema1 = {
      type: 'object',
      required: ['a'],
      properties: {
        a: { type: 'string' },
        b: { type: 'number' },
      },
    }

    schema2 = {
      type: 'object',
      required: ['b'],
      properties: {
        a: { type: 'string', default: 'hello-world' },
        b: { type: 'number' },
        extend: { type: 'boolean' },
      },
    }
  })

  it('merges two schemas', () => {
    const merged = mergeSchemas(schema1, schema2)
    expect(merged).toMatchObject({
      type: 'object',
      required: expect.arrayContaining(['a', 'b']),
      properties: {
        a: { type: 'string', default: 'hello-world' },
        b: { type: 'number' },
        extend: { type: 'boolean' },
      },
    })
  })
})
