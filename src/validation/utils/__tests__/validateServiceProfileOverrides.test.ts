import { merge } from 'lodash'
import { getAwsDbConfigMock } from '@tests/mocks/aws'
import { getServicesSchema, getValidData } from '@src/validation'
import { ValidationError } from '@lib/errors'

describe('isIpOrCidr', () => {
  const db = getAwsDbConfigMock()
  const schema = getServicesSchema()
  const config = [db]

  it('raises an error when the overrides does not contain keys defined by the profile', () => {
    const invalid = merge([], config, [{ overrides: { something: true, invalid: true } }])

    expect(() => getValidData(invalid, schema)).toThrow(ValidationError)
  })

  it('proceeds without an error when the overrides are valid', () => {
    const overrides = { instance: {}, params: {} }
    const withOverrides = merge([], config, [{ overrides }])

    const [serviceWithOverrides] = getValidData(withOverrides, schema)
    expect(serviceWithOverrides).toMatchObject({ overrides })
  })
})
