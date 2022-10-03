import { kebabCase, snakeCase } from 'lodash';
import {
  DataAwsSecretsmanagerRandomPassword, DataAwsSecretsmanagerSecretVersion,
  SecretsmanagerSecret, SecretsmanagerSecretVersion,
} from '@cdktf/provider-aws/lib/secretsmanager';

import { Stack } from '@stackmate/engine/core/stack';
import { REGIONS } from '@stackmate/engine/providers/aws/constants';
import { getServiceProfile } from '@stackmate/engine/core/profile';
import { ChoiceOf, extractTokenFromJsonString } from '@stackmate/engine/lib';
import { DEFAULT_PASSWORD_LENGTH, DEFAULT_PROFILE_NAME, PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';
import { AwsServiceAssociations, getAwsCoreService } from '@stackmate/engine/providers/aws/service';
import {
  BaseServiceAttributes, Credentials, CredentialsHandler, CredentialsHandlerOptions,
  Provisionable, ProvisionAssociationRequirements, SecretsVaultService,
  Service, withCredentialsGenerator,
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

type BaseProvisionable = Provisionable & {
  config: AwsSecretsVaultAttributes;
  service: AwsSecretsVaultService;
};

export type AwsSecretsVaultDeployableProvisionable = BaseProvisionable & {
  provisions: AwsSecretsDeployableResources;
  requirements: ProvisionAssociationRequirements<
    AwsSecretsVaultService['associations'], 'deployable'
  >;
};

export type AwsSecretsVaultDestroyableProvisionable = BaseProvisionable & {
  provisions: AwsSecretsDestroyableResources;
  requirements: ProvisionAssociationRequirements<
    AwsSecretsVaultService['associations'], 'destroyable'
  >;
};

export type AwsSecretsVaultPreparableProvisionable = BaseProvisionable & {
  provisions: AwsSecretsPreparableResources;
  requirements: ProvisionAssociationRequirements<
    AwsSecretsVaultService['associations'], 'preparable'
  >;
};

type ProvisionCredentialsResources = {
  password: DataAwsSecretsmanagerRandomPassword;
  secret: SecretsmanagerSecret;
  version: SecretsmanagerSecretVersion;
  data: DataAwsSecretsmanagerSecretVersion;
};

/**
 * @param {AwsSecretsVaultDeployableProvisionable} provisionable the vault's provisionable
 * @param {Stack} stack the stack to deploy resources on
 * @param {CredentialsHandlerOptions} opts the credential handler's options
 * @returns {Credentials} the credentials objects
 * @returns {AwsSecretsDeployableResources} the resources created
 */
export const provisionCredentialResources = (
  provisionable: AwsSecretsVaultDeployableProvisionable,
  stack: Stack, { root = false, ...opts }: CredentialsHandlerOptions = {},
): ProvisionCredentialsResources => {
  const { service, config, requirements: { kmsKey, providerInstance } } = provisionable;
  const secretName = `${stack.projectName}/${stack.stageName}/${kebabCase(config.name.toLowerCase())}`;

  // we only use the default profile, since this is a core service
  const { secret, version, password } = getServiceProfile(
    PROVIDER.AWS, SERVICE_TYPE.SECRETS, DEFAULT_PROFILE_NAME,
  );

  const idPrefix = `${snakeCase(config.name)}_secrets`;
  const username = `${snakeCase(config.name)}_${root ? 'root' : 'user'}`;

  const passwordResource = new DataAwsSecretsmanagerRandomPassword(
    stack.context, `${idPrefix}_password`, {
      passwordLength: opts.length || DEFAULT_PASSWORD_LENGTH,
      excludeCharacters: (opts.exclude || []).join(''),
      ...password,
  });

  const secretResource = new SecretsmanagerSecret(stack.context, `${idPrefix}_secret`, {
    name: secretName,
    description: `Secrets for the ${service} service`,
    kmsKeyId: kmsKey.id,
    provider: providerInstance,
    ...secret,
  });

  const secretVersionResource = new SecretsmanagerSecretVersion(
    stack.context, `${idPrefix}_version`, {
    ...version,
    secretId: secretResource.id,
    secretString: JSON.stringify({
      username,
      password: passwordResource.randomPassword,
    }),
    lifecycle: {
      ignoreChanges: ['secret_string'],
    },
  });

  const data = new DataAwsSecretsmanagerSecretVersion(stack.context, `${idPrefix}_data`, {
    secretId: secret.id,
    versionId: secretVersionResource.id,
  });

  return {
    password: passwordResource,
    secret: secretResource,
    version: secretVersionResource,
    data,
  };
}

/**
 * @param {AwsSecretsVaultDeployableProvisionable} provisionable the vault's provisionable
 * @param {Stack} stack the stack to deploy resources on
 * @param {CredentialsHandlerOptions} opts the credential handler's options
 * @returns {Credentials} the credentials objects
 */
const generateCredentials: CredentialsHandler = (
  provisionable: AwsSecretsVaultDeployableProvisionable, stack, opts = {},
): Credentials => {
  const { data } = provisionCredentialResources(provisionable, stack, opts);

  return {
    username: extractTokenFromJsonString(data.secretString, 'username'),
    password: extractTokenFromJsonString(data.secretString, 'password'),
  };
};

/**
 * @returns {AwsSecretsVaultService} the secrets vault service
 */
export const getSecretsVaultService = (): AwsSecretsVaultService => (
  withCredentialsGenerator(generateCredentials)(getAwsCoreService(SERVICE_TYPE.SECRETS))
);

export const AwsSecretsVault = getSecretsVaultService();
