import { TerraformLocal } from 'cdktf';
import { kebabCase, snakeCase } from 'lodash';
import {
  dataAwsSecretsmanagerRandomPassword, dataAwsSecretsmanagerSecretVersion,
  secretsmanagerSecret, secretsmanagerSecretVersion,
} from '@cdktf/provider-aws';

import { Stack } from '@stackmate/engine/core/stack';
import { REGIONS } from '@stackmate/engine/providers/aws/constants';
import { getServiceProfile } from '@stackmate/engine/core/profile';
import { ChoiceOf, extractTokenFromJsonString } from '@stackmate/engine/lib';
import { DEFAULT_PASSWORD_LENGTH, DEFAULT_PROFILE_NAME, PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';
import { AwsServiceAssociations, getAwsCoreService } from '@stackmate/engine/providers/aws/service';
import {
  BaseServiceAttributes, Credentials, CredentialsHandlerOptions,
  Provisionable, SecretsVaultService, Service, withCredentialsGenerator,
} from '@stackmate/engine/core/service';

export type AwsSecretsVaultAttributes = BaseServiceAttributes & {
  provider: typeof PROVIDER.AWS,
  type: typeof SERVICE_TYPE.SECRETS;
  region: ChoiceOf<typeof REGIONS>;
};

export type AwsSecretsDeployableResources = {};
export type AwsSecretsDestroyableResources = {};
export type AwsSecretsPreparableResources = {};

export type AwsSecretsVaultService = SecretsVaultService<
  Service<AwsSecretsVaultAttributes> & { associations: AwsServiceAssociations }
>;

export type AwsSecretsVaultDeployableProvisionable = Provisionable<
  AwsSecretsVaultService, AwsSecretsDeployableResources, 'deployable'
>;

export type AwsSecretsVaultDestroyableProvisionable = Provisionable<
  AwsSecretsVaultService, AwsSecretsDestroyableResources, 'destroyable'
>;

export type AwsSecretsVaultPreparableProvisionable = Provisionable<
  AwsSecretsVaultService, AwsSecretsDestroyableResources, 'preparable'
>;

type ProvisionCredentialsResources = Credentials & {
  randomPassword: dataAwsSecretsmanagerRandomPassword.DataAwsSecretsmanagerRandomPassword;
  secret: secretsmanagerSecret.SecretsmanagerSecret;
  version: secretsmanagerSecretVersion.SecretsmanagerSecretVersion;
  data: dataAwsSecretsmanagerSecretVersion.DataAwsSecretsmanagerSecretVersion;
};

/**
 * @param {AwsSecretsVaultDeployableProvisionable} provisionable the vault's provisionable
 * @param {Stack} stack the stack to deploy resources on
 * @param {CredentialsHandlerOptions} opts the credential handler's options
 * @returns {ProvisionCredentialsResources} the credentials objects
 */
export const generateCredentials = (
  vault: AwsSecretsVaultDeployableProvisionable,
  target: Provisionable,
  stack: Stack,
  options: CredentialsHandlerOptions = {},
): ProvisionCredentialsResources => {
  const { config } = target;
  const { root = false, length: passwordLength, exclude: excludeCharacters = [] } = options;
  const { service, requirements: { kmsKey, providerInstance } } = vault;
  const idPrefix = `${snakeCase(config.name)}_secrets`;
  const secretName = `${stack.projectName}/${stack.stageName}/${kebabCase(config.name.toLowerCase())}`;

  // we only use the default profile, since this is a core service
  const { secret, version, password } = getServiceProfile(
    PROVIDER.AWS, SERVICE_TYPE.SECRETS, DEFAULT_PROFILE_NAME,
  );

  const passResource = new dataAwsSecretsmanagerRandomPassword.DataAwsSecretsmanagerRandomPassword(
    stack.context, `${idPrefix}_password`, {
      passwordLength: passwordLength || DEFAULT_PASSWORD_LENGTH,
      excludeCharacters: excludeCharacters.join(''),
      ...password,
  });

  const secretResource = new secretsmanagerSecret.SecretsmanagerSecret(
    stack.context, `${idPrefix}_secret`, {
      name: secretName,
      description: `Secrets for the ${service} service`,
      kmsKeyId: kmsKey.id,
      provider: providerInstance,
      ...secret,
    },
  );

  const secretVersionResource = new secretsmanagerSecretVersion.SecretsmanagerSecretVersion(
    stack.context, `${idPrefix}_version`, {
    ...version,
    secretId: secretResource.id,
    secretString: JSON.stringify({
      username: `${snakeCase(config.name)}_${root ? 'root' : 'user'}`,
      password: passResource.randomPassword,
    }),
    lifecycle: {
      ignoreChanges: ['secret_string'],
    },
  });

  const data = new dataAwsSecretsmanagerSecretVersion.DataAwsSecretsmanagerSecretVersion(
    stack.context, `${idPrefix}_data`, {
      secretId: secret.id,
      versionId: secretVersionResource.id,
    },
  );

  const usernameLocal = new TerraformLocal(
    stack.context,
    `${idPrefix}_var_username`,
    extractTokenFromJsonString(data.secretString, 'username'),
  );

  const passwordLocal = new TerraformLocal(
    stack.context,
    `${idPrefix}_var_password`,
    extractTokenFromJsonString(data.secretString, 'password'),
  );

  return {
    username: usernameLocal,
    password: passwordLocal,
    randomPassword: passResource,
    secret: secretResource,
    version: secretVersionResource,
    data,
  };
};

/**
 * @returns {AwsSecretsVaultService} the secrets vault service
 */
export const getSecretsVaultService = (): AwsSecretsVaultService => (
  withCredentialsGenerator(generateCredentials)(
    getAwsCoreService(SERVICE_TYPE.SECRETS),
  )
);

export const AwsSecretsVault = getSecretsVaultService();
