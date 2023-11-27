import { getSchema, getValidData } from '@src/validation'
import type { ServiceConfiguration } from '@services/registry'

describe('getValidData', () => {
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

  it('validates data', () => {
    const valid = getValidData(config, schema)
    expect(valid).toEqual(expect.arrayContaining(config.map((cfg) => expect.objectContaining(cfg))))
  })
})
