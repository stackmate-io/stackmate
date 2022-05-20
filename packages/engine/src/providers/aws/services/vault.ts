import { kebabCase, snakeCase } from 'lodash';
import { Fn, TerraformResource, Token } from 'cdktf';
import {
  DataAwsSecretsmanagerSecretVersion,
  SecretsmanagerSecret,
  SecretsmanagerSecretVersion,
} from '@cdktf/provider-aws/lib/secretsmanager';

import AwsService from './base';
import { getRandomString } from '@stackmate/engine/lib/helpers';
import { DEFAULT_VAULT_SERVICE_NAME, SERVICE_TYPE } from '@stackmate/engine/constants';
import { Attribute, AttributesOf, AwsVaultService, CloudStack, ServiceTypeChoice, VaultCredentialOptions } from '@stackmate/engine/types';

export type AttributeSet = AttributesOf<AwsVaultService>;

class AwsVault extends AwsService implements AwsVaultService {
  /**
   * @var {String} name the name for the service
   */
  name: Attribute<string> = DEFAULT_VAULT_SERVICE_NAME;

  /**
   * @var {String} type the type for the service
   */
  readonly type: ServiceTypeChoice = SERVICE_TYPE.VAULT;

  /**
   * @var {Boolean} registered whether the service is registered into the stack
   */
  private registered: boolean = false;

  /**
   * @var {Object} secrets a
   */
  private secrets: Map<string, { secret: TerraformResource, version: TerraformResource }> = new Map();

  /**
   * @returns {Boolean} whether the vault is registered in the stack
   */
  isRegistered(): boolean {
    return this.registered;
  }

  onDeploy(stack: CloudStack): void {
    /* no-op - every change should be introduced through the username / password methods */
    this.registered = true;
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
    const password = getRandomString({ length, special, exclude });

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

export default AwsVault;
