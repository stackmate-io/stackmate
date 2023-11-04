import { isEmpty } from 'lodash'
import { EnvironmentValidationError } from '@lib/errors'
import type { ServiceEnvironment } from '@core/services/types'

/**
 * Validates an operation's environment variables
 *
 * @param {ServiceEnvironment[]} required the variables required in the environment
 * @throws {Error} if the environment is not properly set up
 */
export const validateEnvironment = (required: ServiceEnvironment[], env = process.env): void => {
  const missing: string[] = []

  required.forEach((envVar) => {
    if (!envVar.required) {
      return false
    }

    if (!(envVar.name in env)) {
      missing.push(envVar.name)
    }
  })

  if (!isEmpty(missing)) {
    throw new EnvironmentValidationError(
      `Your environment is missing some variables: ${missing.join(', ')}`,
      missing,
    )
  }
}
