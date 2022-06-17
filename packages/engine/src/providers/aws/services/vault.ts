import { kebabCase, snakeCase } from 'lodash';
import { Fn, TerraformResource, Token } from 'cdktf';
import {
  DataAwsSecretsmanagerSecretVersion,
  SecretsmanagerSecret,
  SecretsmanagerSecretVersion,
} from '@cdktf/provider-aws/lib/secretsmanager';

import AwsService from './base';
import { getRandomString, mergeJsonSchemas, preventJsonSchemaProperties } from '@stackmate/engine/lib/helpers';
import { CORE_SERVICE_SKIPPED_PROPERTIES, DEFAULT_VAULT_SERVICE_NAME, PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';
import { AWS, CloudStack, CoreServiceConfiguration, VaultCredentialOptions } from '@stackmate/engine/types';
import { AwsServicePrerequisites } from '@stackmate/engine/types/service/aws';

class AwsVault extends AwsService<AWS.Vault.Attributes> implements AWS.Vault.Type {
  /**
   * @var {String} schemaId the schema id for the entity
   * @static
   */
  static schemaId: string = 'services/aws/vault';

  /**
   * @var {Number} recoveryDays the number of days we can recover a secret
   * @static
   */
  static recoveryDays: number = 30;

  /**
   * @var {String} type the type for the service
   */
  readonly type = SERVICE_TYPE.VAULT;

  /**
   * @var {String} name the name for the service
   */
  name: string = DEFAULT_VAULT_SERVICE_NAME;

  /**
   * @var {Object} secrets a
   */
  private secrets: Map<string, { secret: TerraformResource, version: TerraformResource }> = new Map();

  onDeploy(stack: CloudStack, prerequisites: AwsServicePrerequisites): void {
    /* no-op - every change should be introduced through the username / password methods */
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
   * @param {CloudStack} stack the stack to register the credentials to
   * @param {BaseServices.Provider.Type} provider the cloud provider instance
   * @param {String} service the service to provide credentials for
   * @param {Object} opts options to pass along the credentials generation
   * @param {Number} opts.length the length of the generated string
   * @param {Boolean} opts.root whether the credentials are root credentials
   * @param {Boolean} opts.special whether to allow special characters or not
   * @param {String[]} opts.exclude the list of special characters to exclude
   * @returns {Object} the username / password pair
   */
  credentials(stack: CloudStack, provider: AWS.Provider.Type, service: string, opts: VaultCredentialOptions = {}) {
    const secretName = `/${this.projectName}/${this.stageName}/${kebabCase(service.toLowerCase())}`;
    const { secret, version } = this.resourceProfile;
    const { root, length, special, exclude } = opts;

    const idPrefix = `${snakeCase(service)}_secrets`;
    const username = `${snakeCase(service)}_${root ? 'root' : 'user'}`;
    const password = getRandomString({ length, special, exclude });

    const secretResource = new SecretsmanagerSecret(stack, `${idPrefix}_secret`, {
      name: secretName,
      description: `Secrets for the ${service} service`,
      kmsKeyId: provider.key.id,
      provider: provider.resource,
      recoveryWindowInDays: AwsVault.recoveryDays,
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

  /**
   * @returns {Object} the attributes to use when populating the initial configuration
   */
  static config(): CoreServiceConfiguration<AWS.Vault.Attributes> {
    return {
      provider: PROVIDER.AWS,
    };
  }

  /**
   * @returns {BaseJsonSchema} provides the JSON schema to validate the entity by
   */
  static schema(): AWS.Vault.Schema {
    return mergeJsonSchemas(
      preventJsonSchemaProperties(super.schema(), ...CORE_SERVICE_SKIPPED_PROPERTIES), {
      $id: this.schemaId,
      properties: {
        name: {
          default: DEFAULT_VAULT_SERVICE_NAME,
        },
        type: {
          default: SERVICE_TYPE.VAULT,
        },
      },
    });
  }
}

export default AwsVault;
