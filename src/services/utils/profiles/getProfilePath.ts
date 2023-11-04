import { join as joinPaths } from 'node:path'
import { PROFILES_PATH } from '@src/constants'
import { PROFILE_DIRECTORY_OVERRIDES } from '@src/services/constants'
import type { ProviderChoice, ServiceTypeChoice } from '@src/services/types'

/**
 * Returns the absolute path to the profile file
 *
 * @param {String} provider the cloud provider's name
 * @param {String} service the service's name
 * @param {String} name the profile's name
 * @param {Object} options
 * @param {Boolean} options.withExtension whether to include the file name's extension
 * @returns {String} the absolute file's path
 */

export const getProfilePath = (
  provider: ProviderChoice,
  service: ServiceTypeChoice,
  name: string,
  { withExtension = false } = {},
): string => {
  const directory = PROFILE_DIRECTORY_OVERRIDES.get(service) || service
  return joinPaths(PROFILES_PATH, provider, directory, `${name}${withExtension ? '.ts' : ''}`)
}
