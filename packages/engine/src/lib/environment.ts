import { EnvironmentVariableUndefinedError } from '@stackmate/lib/errors';
import { ENVIRONMENT_VARIABLE } from '@stackmate/constants';
import { Credentials } from '@aws-sdk/types';

class Environment {
  /**
   * Returns the credentials that are available through environment variables for AWS
   *
   * @param {String} provider the provider to get the credentials for
   * @returns {Object} the credentials to use
   * @throws {Error} if the provider is not valid
   */
  static getAwsCredentials(): Credentials {
    const {
      env: {
        [ENVIRONMENT_VARIABLE.AWS_ACCESS_KEY_ID]: accessKeyId,
        [ENVIRONMENT_VARIABLE.AWS_SECRET_ACCESS_KEY]: secretAccessKey,
        [ENVIRONMENT_VARIABLE.AWS_SESSION_TOKEN]: sessionToken,
      },
    } = process;

    if (!accessKeyId) {
      throw new EnvironmentVariableUndefinedError(ENVIRONMENT_VARIABLE.AWS_ACCESS_KEY_ID);
    }

    if (!secretAccessKey) {
      throw new EnvironmentVariableUndefinedError(ENVIRONMENT_VARIABLE.AWS_SECRET_ACCESS_KEY);
    }

    return {
      accessKeyId,
      secretAccessKey,
      sessionToken,
    };
  }
}

export default Environment;
