import { Memoize } from 'typescript-memoize';
import { existsSync as fileExistsSync } from 'fs';
import { join as joinPaths, resolve as resolvePath } from 'path';

import { ProviderChoice, ServiceTypeChoice } from '@stackmate/types';
import { ProfileNotFoundError } from '@stackmate/lib/errors';

class Profile {
  /**
   * @var {String} DEFAULT the default profile to use
   * @static
   */
  static DEFAULT: string = 'default';

  /**
   * @var {String} directory the directory that we store the profiles in
   */
  static directory: string = resolvePath('profiles');

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

      throw new ProfileNotFoundError(name);
    }
  }
}

export default Profile;
