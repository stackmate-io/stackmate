import pipe from '@bitty/pipe';

import { SERVICE_TYPE } from '@stackmate/engine/constants';
import { AwsService, getAwsCoreService } from '@stackmate/engine/providers/aws/lib/service';
import {
  CoreServiceAttributes, CredentialsHandler, profilable, ProvisionAssociationRequirements,
  SecretsVaultService, withCredentialsGenerator,
} from '@stackmate/engine/core/service';

export type AwsVaultAttributes = CoreServiceAttributes;

export type AwsSecretsDeployableResources = {};
export type AwsSecretsDestroyableResources = {};
export type AwsSecretsPreparableResources = {};

export type AwsSecretsVaultService = SecretsVaultService<AwsService<AwsVaultAttributes>>;

export type AwsSecretsVaultDeployableProvisionable = {
  provisions: AwsSecretsDeployableResources;
  requirements: ProvisionAssociationRequirements<AwsSecretsVaultService['associations'], 'deployable'>;
};

export type AwsSecretsVaultDestroyableProvisionable = {
  provisions: AwsSecretsDestroyableResources;
  requirements: ProvisionAssociationRequirements<AwsSecretsVaultService['associations'], 'destroyable'>;
};

export type AwsSecretsVaultPreparableProvisionable = {
  provisions: AwsSecretsPreparableResources;
  requirements: ProvisionAssociationRequirements<AwsSecretsVaultService['associations'], 'preparable'>;
};

const generateCredentials: CredentialsHandler = (config, stack, { root = false } = {}) => ({
  username: '', password: '',
});

/**
 * @returns {AwsSecretsVaultService} the secrets vault service
 */
export const getSecretsVaultService = (): AwsSecretsVaultService => {
  return pipe(
    profilable(),
    withCredentialsGenerator(generateCredentials),
  )(getAwsCoreService(SERVICE_TYPE.SECRETS));
};
