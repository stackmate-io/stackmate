import { Fn, Token } from 'cdktf';
import {
  DataAwsSecretsmanagerSecretVersion,
  SecretsmanagerSecret,
  SecretsmanagerSecretVersion,
} from '@cdktf/provider-aws/lib/secretsmanager';

import Vault from '@stackmate/core/services/vault';
import AwsService from '@stackmate/providers/aws/mixins';
import Parser from '@stackmate/lib/parsers';
import { Attribute } from '@stackmate/lib/decorators';
import { AWS_REGIONS } from '@stackmate/providers/aws/constants';
import { CloudStack } from '@stackmate/interfaces';
import { VaultCredentialOptions } from '@stackmate/types';
import { getRandomString } from '@stackmate/lib/helpers';

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
   * @var {Boolean} rotate whether we need to rotate credentials
   */
  @Attribute rotate: boolean = true;

  /**
   * @var {Number} rotationDays how frequently should we rotate the credentials (in days)
   */
  @Attribute rotationDays: number = 60;

  /**
   * @returns {AttributeParsers}
   */
  parsers() {
    return {
      ...super.parsers(),
      key: Parser.parseString,
      region: Parser.parseString,
      rotate: Parser.parseBoolean,
      rotationDays: Parser.parseInteger,
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
      rotate: {
        inclusion: {
          within: [true, false],
          message: 'You need to provide a value that is either true or false',
        },
      },
      rotationDays: {
        numericality: {
          onlyInteger: true,
          greaterThan: 0,
          message: 'The rotation days should be an integer, greater than 0',
        },
      }
    }
  }

  /**
   * @param {String} service the service name to use
   * @returns {String} the prefix to use for the secret
   */
  secretId(service: string): string {
    return `/${this.projectName}/${this.stageName}/${service}`;
  }

  /**
   * Extracts a key from a username / password pair in a data string
   *
   * @param {String} encoded the encoded string
   * @param {String} key the key to get
   * @param {String} defaultValue the default value
   */
  protected extract(encoded: string, key: string, defaultValue: string = '') {
    return Token.asString(Fn.lookup(Fn.jsondecode(encoded), key, defaultValue));
  }

  /**
   * Provides credentials for a service
   *
   * @param {String} service the service to provide credentials for
   * @param {Object} opts options to pass along the credentials generation
   * @param {Number} opts.length the length of the generated string
   * @param {Boolean} opts.root whether the credentials are root credentials
   * @param {Boolean} opts.special whether to allow special characters or not
   * @param {String[]} opts.exclude the list of special characters to exclude
   * @returns {Object} the username / password pair
   */
  credentials(stack: CloudStack, service: string, opts: VaultCredentialOptions = {}) {
    const secretId = this.secretId(service);
    const { secret, version } = this.resourceProfile;
    const { root, length, special, exclude } = opts;

    const username = root ? 'root' : 'user';
    const password = getRandomString({  length, special, exclude });

    const credentials = {
      username,
      password,
    };

    new SecretsmanagerSecret(stack, secretId, {
      name: secretId,
      description: `Secrets for the ${service} service`,
      provider: this.providerService.resource,
      ...secret,
    });

    new SecretsmanagerSecretVersion(stack, secretId, {
      secretId,
      ...version,
      secretString: JSON.stringify(credentials),
      lifecycle: {
        ignoreChanges: ['secret_string'],
      },
    });

    const data = new DataAwsSecretsmanagerSecretVersion(stack, secretId, {
      secretId,
      versionId: 'AWSCURRENT',
    });

    return {
      username: this.extract(data.secretString, 'username'),
      password: this.extract(data.secretString, 'password'),
    };
  }

  onPrepare(stack: CloudStack): void {
  }
}

export default AwsSecretsManager;
