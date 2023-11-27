import { faker } from '@faker-js/faker'
import { EnvironmentValidationError } from '@lib/errors'
import { assertEnvironmentValid } from '@src/operation/utils/assertEnvironmentValid'
import { fromPairs } from 'lodash'
import type { ServiceEnvironment } from '@services/types'

describe('assertEnvironmentValid', () => {
  let vars: ServiceEnvironment<string[]>[]

  beforeEach(() => {
    vars = [
      {
        [faker.lorem.word().toUpperCase()]: {
          description: faker.lorem.sentence(),
          required: true,
        },
      },
      {
        [faker.lorem.word().toUpperCase()]: {
          description: faker.lorem.sentence(),
          required: false,
        },
      },
      {
        [faker.lorem.word().toUpperCase()]: {
          description: faker.lorem.sentence(),
          required: true,
        },
      },
    ]
  })

  it('raises an error when there are required environment variables missing', () => {
    expect(() => assertEnvironmentValid(vars)).toThrow(EnvironmentValidationError)
  })

  it('does not raise an error when all required variables are present', () => {
    const envWithRequiredParams = fromPairs(
      vars
        .map((envVar) =>
          Object.entries(envVar).map(([varName, setup]) => [
            varName,
            setup.required ? faker.lorem.word() : '',
          ]),
        )
        .flat(),
    )

    expect(() => assertEnvironmentValid(vars, envWithRequiredParams)).not.toThrow()
  })
})
