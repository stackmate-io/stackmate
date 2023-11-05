import { fromPairs } from 'lodash'
import { faker } from '@faker-js/faker'
import { EnvironmentValidationError } from '@lib/errors'
import { validateEnvironment } from '@services/utils'
import type { ServiceEnvironment } from '@services/types'

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
