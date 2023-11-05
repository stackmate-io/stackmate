import fs from 'node:fs'
import { getAwsDbMock } from '@mocks/aws'
import { ValidationError, ValidationErrorDescriptor } from '@lib/errors'
import { getSchema, getValidData } from '@src/validation'

describe('serviceProfile', () => {
  const db = getAwsDbMock()
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

    expect(errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: '0.profile', message: 'Invalid service profile defined' })
    ]))

    existMock.mockRestore()
  })

  it('proceeds without errors for valid service profiles', () => {
    const [serviceWithProfile] = getValidData(config, schema)
    expect(serviceWithProfile).toMatchObject({ profile: db.profile })
  })
})
