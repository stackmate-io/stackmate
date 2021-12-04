import { isEmpty } from 'lodash';
import { SSM } from '@aws-sdk/client-ssm';
import { Credentials } from '@aws-sdk/types';
import validate from 'validate.js';

import BaseStorageAdapter from '@stackmate/core/adapters/storage/base';
import Environment from '@stackmate/core/environment';
import { Validatable } from '@stackmate/interfaces';
import { ValidationError } from '@stackmate/core/errors';
import { AwsParamStorageOptions, Validations } from '@stackmate/types';
import { AWS_REGIONS } from '@stackmate/clouds/aws/constants';
import { Cached } from '@stackmate/core/decorators';

class AwsParameterStore extends BaseStorageAdapter implements Validatable {
  /**
   * @var {String} key the key arn to use for encryption / decryption
   */
  readonly key: string;

  /**
   * @var {String} region the region that the params are stored into
   */
  readonly region: string;

  constructor(options: AwsParamStorageOptions) {
    super(options);

    this.validate(options);

    ({ key: this.key, region: this.region } = options);
  }

  /**
   * Returns a list of validations to validate the structure of the configuration file with
   *
   * @returns {Validations} the list of validations to use for the config file
   */
  validations(): Validations {
    return {
      key: {
        presence: {
          message: 'A key in the form of a KMS ARN should be specified',
        },
        format: {
          pattern: '^arn:aws:[a-z0-9-]+:[0-9]+/[a-z0-9-]+$',
          message: 'Please provide a valid KMS ARN (eg. arn:aws:eu-central-1:11111111/abc-123-abc)',
        },
      },
      region: {
        presence: {
          message: 'A region should be specified',
        },
        inclusion: {
          within: AWS_REGIONS,
          message: 'The region specified is not valid',
        },
      },
    };
  }

  /**
   * Validates the configuration file's structure.
   * The subsequent service values will be validated during service initialization.
   *
   * @param {Object} contents the contents to validate
   * @throws {ValidationError} when the file structure invalid
   */
  validate(contents: AwsParamStorageOptions): void {
    const errors = validate.validate(contents, this.validations(), { fullMessages: false });

    if (!isEmpty(errors)) {
      throw new ValidationError(
        'The “vault” section in the project configuration is invalid', errors,
      );
    }
  }

  @Cached()
  public get client(): SSM {
    const client = new SSM({
      region: this.region,
      credentials: Environment.getAwsCredentials(),
    });

    return client;
  }


  async read(): Promise<object> {
    const params = await this.client.getParametersByPath({ 'Path': '/manual-testing' });
    console.log(params);
    return {};
  }

  async write(contents: object): Promise<void> {
  }
}

export default AwsParameterStore;
