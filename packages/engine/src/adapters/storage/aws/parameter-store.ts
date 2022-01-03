import { SSM } from '@aws-sdk/client-ssm';
import { Memoize } from 'typescript-memoize';

import BaseStorageAdapter from '@stackmate/adapters/storage/base';
import Environment from '@stackmate/lib/environment';
import { AttributeParsers, Validations } from '@stackmate/types';
import { AWS_REGIONS } from '@stackmate/clouds/aws/constants';
import { Attribute } from '@stackmate/lib/decorators';
import { parseString } from '@stackmate/lib/parsers';

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
   * @var {String} project the name of the project
   */
  @Attribute project: string;

  /**
   * @var {String} stage the name of the stage
   */
  @Attribute stage: string;

  /**
   * @var {String} validationMessage the error message
   */
  readonly validationMessage: string = 'The “vault” section in the project configuration is invalid';

  /**
   * @returns {Object} the parser functions to use
   */
  parsers(): AttributeParsers {
    return {
      key: parseString,
      region: parseString,
      project: parseString,
      stage: parseString,
    };
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
          pattern: '^arn:aws:[a-z0-9-:]+:[0-9]+(:[a-z0-9]+)?/[a-z0-9-]+$',
          flags: 'i',
          message: 'Please provide a valid KMS ARN (eg. arn:aws:eu-central-1:11111111/abc-123-abc)',
        },
      },
      region: {
        presence: {
          message: 'A region should be specified',
        },
        inclusion: {
          within: Object.values(AWS_REGIONS),
          message: 'The region specified is not valid',
        },
      },
      project: {
        presence: {
          message: 'The project’s name should be specified as storage options',
        },
      },
      stage: {
        presence: {
          message: 'The stage’s name should be specified as storage options',
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

  /**
   * @returns {String} the namespace to use in the SSM param store
   */
  public get namespace() : string {
    return `/${this.project}/${this.stage}`;
  }

  /**
   * @returns {Promise<Object>} the parameters under a specific path
   */
  async read(): Promise<object> {
    const params = await this.client.getParametersByPath({ 'Path': this.namespace });
    return params;
  }

  /**
   * @param {Object} contents the params to write to AWS SSM
   * @void
   */
  async write(contents: object): Promise<void> {
  }
}

export default AwsParameterStore;
