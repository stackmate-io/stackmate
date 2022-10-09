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
  password: dataAwsSecretsmanagerRandomPassword.DataAwsSecretsmanagerRandomPassword;
  secret: secretsmanagerSecret.SecretsmanagerSecret;
  version: secretsmanagerSecretVersion.SecretsmanagerSecretVersion;
  data: dataAwsSecretsmanagerSecretVersion.DataAwsSecretsmanagerSecretVersion;
};

/**
 * @param {AwsSecretsVaultDeployableProvisionable} vault the vault's provisionable
 * @param {Provisionable} target the service to add the credentials for
 * @param {Stack} stack the stack to deploy resources on
 * @param {CredentialsHandlerOptions} opts the credential handler's options
 * @returns {Credentials} the credentials objects
 * @returns {AwsSecretsDeployableResources} the resources created
 */
export const provisionCredentialResources = (
  vault: AwsSecretsVaultDeployableProvisionable,
  target: Provisionable,
  stack: Stack, { root = false, ...opts }: CredentialsHandlerOptions = {},
): ProvisionCredentialsResources => {
  const { service, requirements: { kmsKey, providerInstance } } = vault;
  const { config } = target;
  const secretName = `${stack.projectName}/${stack.stageName}/${kebabCase(config.name.toLowerCase())}`;

  // we only use the default profile, since this is a core service
  const { secret, version, password } = getServiceProfile(
    PROVIDER.AWS, SERVICE_TYPE.SECRETS, DEFAULT_PROFILE_NAME,
  );

  const idPrefix = `${snakeCase(config.name)}_secrets`;
  const username = `${snakeCase(config.name)}_${root ? 'root' : 'user'}`;

  const passResource = new dataAwsSecretsmanagerRandomPassword.DataAwsSecretsmanagerRandomPassword(
    stack.context, `${idPrefix}_password`, {
      passwordLength: opts.length || DEFAULT_PASSWORD_LENGTH,
      excludeCharacters: (opts.exclude || []).join(''),
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
      username,
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

  return {
    password: passResource,
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
  provisionable: AwsSecretsVaultDeployableProvisionable, target: Provisionable, stack, opts = {},
): Credentials => {
  const { data } = provisionCredentialResources(provisionable, target, stack, opts);

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
