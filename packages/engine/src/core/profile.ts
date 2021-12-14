import path from 'path';
import { merge } from 'lodash';

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
  static directory: string = path.resolve('profiles');

  /**
   * Loads and returns a profile and applies any overrides
   *
   * @param {String} provider the cloud provider's name
   * @param {String} service the service's name
   * @param {String} name the profile's name
   * @param {Object} overrides any options to override
   * @returns {Object}
   */
  static get(provider: ProviderChoice, service: ServiceTypeChoice, name: string, overrides: object = {}): object {
    try {
      const profile = require(
        path.join(this.directory, provider, service, name),
      );

      return merge({ ...profile, overrides });
    } catch (error) {
      throw new ProfileNotFoundError(name);
    }
  }
}

export default Profile;
