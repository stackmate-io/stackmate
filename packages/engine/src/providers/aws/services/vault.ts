import Vault from '@stackmate/core/services/vault';
import AwsService from '@stackmate/providers/aws/mixins';
import Parser from '@stackmate/lib/parsers';
import { Attribute } from '@stackmate/lib/decorators';
import { AWS_REGIONS } from '@stackmate/providers/aws/constants';
import { CloudStack } from '@stackmate/interfaces';

const AwsVaultService = AwsService(Vault);

class AwsSecretsManager extends AwsVaultService {
  /**
   * @var {String} key the key arn to use for encryption / decryption
   */
  @Attribute key: string;

  /**
   * @var {String} region the region that the params are stored into
   */
  @Attribute region: string;

  /**
   * @returns {AttributeParsers}
   */
  parsers() {
    return {
      ...super.parsers(),
      key: Parser.parseString,
      region: Parser.parseString,
    };
  }

  /**
   * @returns {Validations}
   */
  validations() {
    return {
      ...super.validations(),
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
          allowEmpty: false,
        },
        inclusion: {
          within: Object.values(AWS_REGIONS),
          message: 'The region specified is not valid',
        },
      },
    }
  }

  /**
   * Provides credentials for a service
   *
   * @param {String} service the service to provide credentials for
   * @param {Boolean} root whether the credentials are root credentials
   * @returns {Object} the username / password pair
   */
  credentials(service: string, root: boolean): { username: string; password: string } {
    return { username: 'abc', password: 'abc' };
  }

  onPrepare(stack: CloudStack): void {
  }
}

export default AwsSecretsManager;
