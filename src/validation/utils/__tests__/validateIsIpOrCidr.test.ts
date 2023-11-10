import { merge } from 'lodash'
import { getAwsDbMock } from '@tests/mocks'
import { getSchema, getValidData } from '@src/validation/utils/getSchema'
import { ValidationError } from '@lib/errors'

describe('isIpOrCidr', () => {
  const db = getAwsDbMock()
  const schema = getSchema()
  const config = [db]

  it('raises an error when an invalid IP is used', () => {
    const invalid = merge([], config, [{ externalLinks: ['abcdefg'] }])
    expect(() => getValidData(invalid, schema)).toThrow(ValidationError)
  })

  it('proceeds without an error when the IPs used are valid', () => {
    const externalLinks = ['192.168.1.1', '192.168.29.32']
    const withIPs = merge([], config, [{ externalLinks }])

    const [serviceWithExtraLinks] = getValidData(withIPs, schema)
    expect(serviceWithExtraLinks).toMatchObject({ externalLinks })
  })

  it('proceeds without an error when the CIDR used is valid', () => {
    const externalLinks = ['192.168.1.1/24', '192.168.29.32/32']
    const withCidr = merge([], config, [{ externalLinks }])

    const [serviceWithExtraLinks] = getValidData(withCidr, schema)
    expect(serviceWithExtraLinks).toMatchObject({ externalLinks })
  })
})
