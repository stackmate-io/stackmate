import { kebabCase, snakeCase } from 'lodash';
import { Fn, TerraformResource, Token } from 'cdktf';
import {
  DataAwsSecretsmanagerSecretVersion,
  SecretsmanagerSecret,
  SecretsmanagerSecretVersion,
} from '@cdktf/provider-aws/lib/secretsmanager';

import Vault from '@stackmate/engine/core/services/vault';
import AwsService from '@stackmate/engine/providers/aws/mixins';
import { CloudStack } from '@stackmate/engine/interfaces';
import { VaultCredentialOptions } from '@stackmate/engine/types';
import { getRandomString } from '@stackmate/engine/lib/helpers';

const AwsVaultService = AwsService(Vault);

class AwsSecretsManager extends AwsVaultService {
  /**
   * @var {Object} secrets a
   */
  private secrets: Map<string, { secret: TerraformResource, version: TerraformResource }> = new Map();

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
      kmsKeyId: this.providerService.key.id,
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
}

export default AwsSecretsManager;
