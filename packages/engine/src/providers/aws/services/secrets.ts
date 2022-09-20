import pipe from '@bitty/pipe';

import { SERVICE_TYPE } from '@stackmate/engine/constants';
import { AwsServiceAssociations, getAwsCoreService } from '@stackmate/engine/providers/aws/services/core';
import {
  CoreServiceAttributes, CredentialsHandler, profilable, ProvisionAssociationRequirements,
  SecretsVaultService, Service, withCredentialsGenerator,
} from '@stackmate/engine/core/service';

export type AwsVaultAttributes = CoreServiceAttributes;

export type AwsSecretsDeployableResources = {};
export type AwsSecretsDestroyableResources = {};
export type AwsSecretsPreparableResources = {};

export type AwsSecretsVaultService = SecretsVaultService<
  Service<AwsVaultAttributes> & { associations: AwsServiceAssociations }
>;

type BaseProvisionable = {
  id: string;
  config: AwsVaultAttributes;
  service: AwsSecretsVaultService;
};

export type AwsSecretsVaultDeployableProvisionable = BaseProvisionable & {
  provisions: AwsSecretsDeployableResources;
  requirements: ProvisionAssociationRequirements<AwsSecretsVaultService['associations'], 'deployable'>;
};

export type AwsSecretsVaultDestroyableProvisionable = BaseProvisionable & {
  provisions: AwsSecretsDestroyableResources;
  requirements: ProvisionAssociationRequirements<AwsSecretsVaultService['associations'], 'destroyable'>;
};

export type AwsSecretsVaultPreparableProvisionable = BaseProvisionable & {
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
