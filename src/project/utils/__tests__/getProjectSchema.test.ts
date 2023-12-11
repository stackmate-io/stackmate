import { getValidData } from '@src/validation'
import { ValidationError } from '@lib/errors'
import { getProjectSchema } from 'src/project/utils/getProjectSchema'
import { isEmpty } from 'lodash'
import { ENVIRONMENT } from '@src/project/constants'
import { SERVICE_TYPE } from '@src/constants'
import type { ValidationErrorDescriptor } from '@lib/errors'

describe('getProjectSchema', () => {
  const schema = getProjectSchema()
  let errorsCache: ValidationErrorDescriptor[] = []

  beforeEach(() => {
    errorsCache = []
  })

  const hasValidationError = (data: any, opts: { key?: string; message?: string }) => {
    if (isEmpty(errorsCache)) {
      try {
        getValidData(data, schema)
      } catch (err) {
        if (err instanceof ValidationError) {
          errorsCache.push(...err.errors)
        }
      }
    }

    return errorsCache.some(
      (error) =>
        (opts.key && opts.key === error.key) ||
        (opts.message && error.message?.includes(opts.message)),
    )
  }

  it('raises a validation error when the provider is not valid', () => {
    expect(
      hasValidationError(
        { provider: 'omg' },
        { key: 'provider', message: 'must be equal to one of the allowed values' },
      ),
    ).toBe(true)
  })

  it('raises a validation error when the domains in the environment are not unique', () => {
    const data = {
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

    expect(
      hasValidationError(data, {
        key: 'environments.production',
        message: 'The same domain name is configured to more than one application services',
      }),
    ).toBe(true)
  })
})
