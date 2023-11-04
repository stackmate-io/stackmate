import { getProfilePath } from '@src/services/utils/profiles/getProfilePath'
import type { ProviderChoice, ServiceTypeChoice } from 'src/services/types'

/**
 * Loads and returns a profile and applies any overrides
 *
 * @param {String} provider the cloud provider's name
 * @param {String} service the service's name
 * @param {String} name the profile's name
 * @returns {Object} the profile configuration
 * @throws {Error} if the profile was not found
 */
export const getProfile = (
  provider: ProviderChoice,
  service: ServiceTypeChoice,
  name: string,
): Record<string, object> => {
  try {
    const profilePath = getProfilePath(provider, service, name)
    // eslint-disable-next-line global-require,import/no-dynamic-require
    return require(profilePath)
  } catch (error) {
    throw new Error(`The profile ${name} was not found in the system`)
  }
}
