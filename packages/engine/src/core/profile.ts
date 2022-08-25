import { join as joinPaths } from 'node:path';

import { DEFAULT_PROFILE_NAME, PROFILES_PATH } from '@stackmate/engine/constants';
import { ProviderChoice, ServiceTypeChoice } from '@stackmate/engine/types';

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
 * @param {Boolean} tolarateMissingDefault whether to tolerate missing the default profile
 * @returns {Object} the profile configuration
 * @throws {Error} if the profile was not found
 */
export const getServiceProfile = (
  provider: ProviderChoice, service: ServiceTypeChoice, name: string, tolarateMissingDefault = true,
): object => {
  try {
    const profilePath = getProfilePath(provider, service, name);
    // eslint-disable-next-line global-require,import/no-dynamic-require
    return require(profilePath);
  } catch (error) {
    // Tolerate missing default profiles so that we avoid
    // having default.ts files that export an empty object
    if (tolarateMissingDefault && name === DEFAULT_PROFILE_NAME) {
      return {};
    }

    throw new Error(`The profile ${name} was not found in the system`);
  }
};
