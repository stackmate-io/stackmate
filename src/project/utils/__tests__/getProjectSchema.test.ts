import { getProjectSchema } from 'src/project/utils/getProjectSchema'
import { ENVIRONMENT } from '@src/project/constants'
import { SERVICE_TYPE } from '@src/constants'
import { getValidData } from '@src/validation'
import { faker } from '@faker-js/faker'
import { snakeCase } from 'lodash'

describe('getProjectSchema', () => {
  const schema = getProjectSchema()

  it('raises a validation error when the provider is not valid', () => {
    expect(() => getValidData({ provider: 'omg' }, schema)).toThrowValidationError({
      path: 'provider',
      message: 'must be equal to one of the allowed values',
    })
  })

  it('raises a validation error when the domains in the environment are not unique', () => {
    const data = {
      state: {
        bucket: snakeCase(faker.internet.domainName()),
        lockTable: snakeCase(faker.internet.domainName()),
      },
      environments: {
        [ENVIRONMENT.PRODUCTION]: {
          app1: {
            type: SERVICE_TYPE.APP,
            domain: 'stackmate.io',
          },
          app2: {
            type: SERVICE_TYPE.APP,
            domain: 'stackmate.io',
          },
        },
      },
    }

    expect(() => getValidData(data, schema)).toThrowValidationError({
      path: 'environments.production',
      message: 'The same domain name is configured to more than one application services',
    })
  })
})
