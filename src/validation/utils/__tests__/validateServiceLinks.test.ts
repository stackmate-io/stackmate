import { merge } from 'lodash'
import { ValidationError } from '@lib/errors'
import { getServicesSchema, getValidData } from '@src/validation'
import { getAwsDbConfigMock } from '@tests/mocks'
import type { ServiceAttributes } from '@services/registry'
import type { AwsMariaDBAttributes, AwsPostgreSQLAttributes } from '@aws/services/database'

describe('serviceLinks', () => {
  const schema = getServicesSchema()
  const db1 = getAwsDbConfigMock('mariadb') as AwsMariaDBAttributes
  const db2 = getAwsDbConfigMock('postgresql') as AwsPostgreSQLAttributes

  const config: ServiceAttributes[] = [db1, db2]

  it('raises an error when the service links contain invalid entries', () => {
    const invalid = merge([], config, [{ links: ['some-invalid-link'] }])
    expect(() => getValidData(invalid, schema)).toThrow(ValidationError)
  })

  it('proceeds without an error for valid service links', () => {
    const links = [db2.name]
    const withLinks = merge([], config, [{ links }])

    const [serviceWithLinks] = getValidData(withLinks, schema)
    expect(serviceWithLinks).toMatchObject({ links: expect.arrayContaining(links) })
  })
})
