import { difference, isEmpty } from 'lodash'
import { EnvironmentValidationError } from '@lib/errors'
import type { ServiceEnvironment } from '@services/types'

/**
 * Validates an operation's environment variables
 *
 * @param {ServiceEnvironment} environment the environment variables in the setup
 * @param {Dictionary<string|unknown>} variables the variables repository
 * @throws {Error} if the environment is not properly set up
 */
export const assertEnvironmentValid = (
  environment: ServiceEnvironment<string[]>[],
  variables = process.env,
): void => {
  const required = environment
    .map((env) =>
      Object.entries(env)
        .filter(([_varName, setup]) => setup.required)
        .map(([varName]) => varName),
    )
    .flat()

  const missing = difference(required, Object.keys(variables))

  if (!isEmpty(missing)) {
    throw new EnvironmentValidationError(
      `Your environment is missing some variables: ${missing.join(', ')}`,
      missing,
    )
  }
}
