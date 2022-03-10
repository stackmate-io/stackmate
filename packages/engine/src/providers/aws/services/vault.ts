import { kebabCase, snakeCase } from 'lodash';
import { Fn, TerraformResource, Token } from 'cdktf';
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
   * @var {Object} secrets a
   */
  private secrets: Map<string, { secret: TerraformResource, version: TerraformResource }> = new Map();

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
    const secretName = `/${this.projectName}/${this.stageName}/${kebabCase(service.toLowerCase())}`;
    const { secret, version } = this.resourceProfile;
    const { root, length, special, exclude } = opts;

    const idPrefix = `${snakeCase(service)}_secrets`;
    const username = `${snakeCase(service)}_${root ? 'root' : 'user'}`;
    const password = getRandomString({  length, special, exclude });

    const secretResource = new SecretsmanagerSecret(stack, `${idPrefix}_secret`, {
      name: secretName,
      description: `Secrets for the ${service} service`,
      provider: this.providerService.resource,
      ...secret,
    });

    const secretVersionResource = new SecretsmanagerSecretVersion(stack, `${idPrefix}_version`, {
      ...version,
      secretId: secretResource.id,
      secretString: JSON.stringify({ username, password }),
      lifecycle: {
        ignoreChanges: ['secret_string'],
      },
    });

    const data = new DataAwsSecretsmanagerSecretVersion(stack, `${idPrefix}_data`, {
      secretId: secretResource.id,
      versionId: 'AWSCURRENT',
    });

    this.secrets.set(service, {
      secret: secretResource,
      version: secretVersionResource,
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
