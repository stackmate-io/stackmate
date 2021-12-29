import { SSM } from '@aws-sdk/client-ssm';
import { Memoize } from 'typescript-memoize';

import BaseStorageAdapter from '@stackmate/adapters/storage/base';
import Environment from '@stackmate/lib/environment';
import { Validations } from '@stackmate/types';
import { AWS_REGIONS } from '@stackmate/clouds/aws/constants';
import { Attribute } from '@stackmate/lib/decorators';

class AwsParameterStore extends BaseStorageAdapter {
  /**
   * @var {String} key the key arn to use for encryption / decryption
   */
  @Attribute key: string;

  /**
   * @var {String} region the region that the params are stored into
   */
  @Attribute region: string;

  /**
   * @returns {String} the error message
   */
  public get validationMessage(): string {
    return 'The “vault” section in the project configuration is invalid';
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
          flags: 'i',
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

  @Memoize()
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
