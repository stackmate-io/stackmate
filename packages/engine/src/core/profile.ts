import { join as joinPaths } from 'node:path';

import { PROFILES_PATH } from '@stackmate/engine/constants';
import { ProviderChoice, ServiceTypeChoice } from '@stackmate/engine/core/service';

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
  provider: ProviderChoice, service: ServiceTypeChoice, name: string, { withExtension = false } = {},
): string => {
  const fileName = `${name}${withExtension ? '.ts' : ''}`;
  return joinPaths(PROFILES_PATH, provider, service, fileName);
};

/**
 * Loads and returns a profile and applies any overrides
 *
 * @param {String} provider the cloud provider's name
 * @param {String} service the service's name
 * @param {String} name the profile's name
 * @returns {Object} the profile configuration
 * @throws {Error} if the profile was not found
 */
export const getServiceProfile = (
  provider: ProviderChoice, service: ServiceTypeChoice, name: string
): object => {
  try {
    const profilePath = getProfilePath(provider, service, name);
    // eslint-disable-next-line global-require,import/no-dynamic-require
    return require(profilePath);
  } catch (error) {
    throw new Error(`The profile ${name} was not found in the system`);
  }
};
