import { join as joinPaths } from 'node:path';

import { merge } from 'lodash';

import { PROFILES_PATH } from '@stackmate/engine/constants';
import {
  BaseServiceAttributes, ProviderChoice, ServiceTypeChoice, ProfilableAttributes,
} from '@stackmate/engine/core/service';

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
): Record<string, any> => {
  try {
    const profilePath = getProfilePath(provider, service, name);
    // eslint-disable-next-line global-require,import/no-dynamic-require
    return require(profilePath);
  } catch (error) {
    throw new Error(`The profile ${name} was not found in the system`);
  }
};

/**
 * Merges the service's requested profile with any overrides
 *
 * @param {BaseServiceAttributes & ProfilableAttributes} config the service configuration
 * @returns {Object} the result of merging the profile with the service's overrides
 */
export const getResourcesProfile = <T extends BaseServiceAttributes & ProfilableAttributes>(
  config: T,
): object => {
  const profile = getServiceProfile(config.provider, config.type, config.profile);
  return merge(profile, config.overrides);
};
