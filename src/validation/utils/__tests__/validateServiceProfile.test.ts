import fs from 'node:fs'
import { getAwsDbConfigMock } from '@tests/mocks'
import { ValidationError } from '@lib/errors'
import { getSchema, getValidData } from '@src/validation'
import type { ValidationErrorDescriptor } from '@lib/errors'

describe('serviceProfile', () => {
  const db = getAwsDbConfigMock()
  const config = [db]
  const schema = getSchema()

  it('raises an error when the service profile is invalid', () => {
    const existMock = jest.spyOn(fs, 'existsSync').mockReturnValue(false)
    let errors: ValidationErrorDescriptor[] = []

    try {
      getValidData(config, schema)
    } catch (err) {
      if (!(err instanceof ValidationError)) {
        fail('Failed with a different error type')
      }

      errors = err.errors
    }

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: '0.profile', message: 'Invalid service profile defined' }),
      ]),
    )

    existMock.mockRestore()
  })

  it('proceeds without errors for valid service profiles', () => {
    const [serviceWithProfile] = getValidData(config, schema)
    expect(serviceWithProfile).toMatchObject({ profile: db.profile })
  })
})
