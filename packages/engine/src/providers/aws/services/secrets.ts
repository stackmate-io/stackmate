import pipe from '@bitty/pipe';

import { REGIONS } from '@stackmate/engine/providers/aws/constants';
import { ChoiceOf } from '@stackmate/engine/lib';
import { PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';
import { AwsServiceAssociations, getAwsCoreService } from '@stackmate/engine/providers/aws/service';
import {
  CoreServiceAttributes, CredentialsHandler, profilable, Provisionable, ProvisionAssociationRequirements,
  SecretsVaultService, Service, withCredentialsGenerator,
} from '@stackmate/engine/core/service';

export type AwsVaultAttributes = CoreServiceAttributes & {
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
