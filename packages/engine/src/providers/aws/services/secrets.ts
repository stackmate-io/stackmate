import pipe from '@bitty/pipe';

import { REGIONS } from '@stackmate/engine/providers/aws/constants';
import { ChoiceOf } from '@stackmate/engine/lib';
import { PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';
import { AwsServiceAssociations, getAwsCoreService } from '@stackmate/engine/providers/aws/service';
import {
  BaseServiceAttributes, CredentialsHandler, profilable, Provisionable, ProvisionAssociationRequirements,
  SecretsVaultService, Service, withCredentialsGenerator,
} from '@stackmate/engine/core/service';

export type AwsVaultAttributes = BaseServiceAttributes & {
  provider: typeof PROVIDER.AWS,
  type: typeof SERVICE_TYPE.SECRETS;
  region: ChoiceOf<typeof REGIONS>;
};

export type AwsSecretsDeployableResources = {};
export type AwsSecretsDestroyableResources = {};
export type AwsSecretsPreparableResources = {};

export type AwsSecretsVaultService = SecretsVaultService<
  Service<AwsVaultAttributes> & { associations: AwsServiceAssociations }
>;

type BaseProvisionable = Provisionable & {
  config: AwsVaultAttributes;
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

const generateCredentials: CredentialsHandler = (
  provisionable: AwsSecretsVaultDeployableProvisionable, stack, { root = false } = {},
) => {
  /*
  const { service, config } = provisionable;
  const secretName = `${stack.projectName}/${stack.stageName}/${kebabCase(service.name.toLowerCase()) }`
  const secretName = `/${this.projectName}/${this.stageName}/${}`;
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
  */
  return {
    username: '', password: '',
  };
};

/**
 * @returns {AwsSecretsVaultService} the secrets vault service
 */
export const getSecretsVaultService = (): AwsSecretsVaultService => (
  pipe(
    profilable(),
    withCredentialsGenerator(generateCredentials),
  )(getAwsCoreService(SERVICE_TYPE.SECRETS))
);

export const AwsSecretsVault = getSecretsVaultService();
