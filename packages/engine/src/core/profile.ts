import { join as joinPaths } from 'node:path';
import { existsSync as fileExistsSync } from 'node:fs';

import { Memoize } from 'typescript-memoize';

import { DEFAULT_PROFILE_NAME, PROFILES_PATH } from '@stackmate/engine/constants';
import { ProviderChoice, ServiceTypeChoice } from '@stackmate/engine/types';

class Profile {
  /**
   * @var {String} DEFAULT the default profile to use
   * @static
   */
  static DEFAULT: string = DEFAULT_PROFILE_NAME;

  /**
   * @var {String} directory the directory that we store the profiles in
   */
  static directory: string = PROFILES_PATH;

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
  static path(
    provider: ProviderChoice,
    service: ServiceTypeChoice,
    name: string,
    { withExtension = false } = {},
  ): string {
    const fileName = `${name}${withExtension ? '.ts' : ''}`;
    return joinPaths(this.directory, provider, service, fileName);
  }

  /**
   * Checks whether the given profile is the default one
   *
   * @param {String} name the profile's name
   * @returns {Boolean} whether the given profile is the default
   */
  static isDefault(name: string): boolean {
    return name === Profile.DEFAULT;
  }

  /**
   * Checks whether a profile exists
   *
   * @param {String} provider the cloud provider's name
   * @param {String} service the service's name
   * @param {String} name the profile's name
   */
  static exists(provider: ProviderChoice, service: ServiceTypeChoice, name: string): boolean {
    if (Profile.isDefault(name)) {
      return true;
    }

    return fileExistsSync(Profile.path(provider, service, name, { withExtension: true }));
  }

  static list(provider: ProviderChoice, type: ServiceTypeChoice) {
  }

  /**
   * Loads and returns a profile and applies any overrides
   *
   * @param {String} provider the cloud provider's name
   * @param {String} service the service's name
   * @param {String} name the profile's name
   * @returns {Object}
   */
  @Memoize((...args: any[]) => args.join(':'))
  static get(provider: ProviderChoice, service: ServiceTypeChoice, name: string): object {
    try {
      // eslint-disable-next-line global-require,import/no-dynamic-require
      return require(Profile.path(provider, service, name));
    } catch (error) {
      // Tolerate missing default profiles so that we avoid
      // having default.ts files that export an empty object
      if (Profile.isDefault(name)) {
        return {};
      }

      throw new Error(`The profile ${name} was not found in the system`);
    }
  }
}

export default Profile;
