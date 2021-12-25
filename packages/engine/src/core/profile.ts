import { Memoize } from 'typescript-memoize';
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
      const profile = require(joinPaths(this.directory, provider, service, name));

      return profile;
    } catch (error) {
      throw new ProfileNotFoundError(name);
    }
  }
}

export default Profile;
