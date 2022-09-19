import pipe from '@bitty/pipe';
import { KmsKey } from '@cdktf/provider-aws/lib/kms';
import { AwsProvider } from '@cdktf/provider-aws';

import { PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';
import { DEFAULT_REGION, REGIONS } from '@stackmate/engine/providers/aws/constants';
import { AwsProviderProvisionable } from '@stackmate/engine/providers/aws/services/provider';
import {
  associate, CoreServiceAttributes, getCoreService, profilable, Provisionable,
  Service, ServiceAssociation, ServiceScopeChoice, withRegions,
} from '@stackmate/engine/core/service';

export type AwsVaultAttributes = CoreServiceAttributes & {
  recoveryDays?: number;
};

export type AwsSecretsDeployableResources = {};
export type AwsSecretsDestroyableResources = {};
export type AwsSecretsPreparableResources = {};

type ProvisionablesPerScope<S extends ServiceScopeChoice> = S extends 'deployable'
  ? AwsSecretsDeployableResources
  : S extends 'destroyable'
    ? AwsSecretsDestroyableResources
    : S extends 'preparable'
      ? AwsSecretsPreparableResources
      : never;

type SecretsVaultAssociations = {
  kmsKey: ServiceAssociation<typeof SERVICE_TYPE.PROVIDER, 'deployable', KmsKey>,
  providerInstance: ServiceAssociation<typeof SERVICE_TYPE.PROVIDER, 'deployable', AwsProvider>;
};

export type AwsSecretsVaultService = Service<AwsVaultAttributes> & {
  associations: SecretsVaultAssociations;
};

export type AwsSecretsProvisionable<S extends ServiceScopeChoice> = Provisionable & {
  id: string;
  config: AwsVaultAttributes;
  service: AwsSecretsVaultService;
  requirements: {},
  provisions: ProvisionablesPerScope<S>;
};

const associations: SecretsVaultAssociations = {
  kmsKey: {
    from: SERVICE_TYPE.PROVIDER,
    scope: 'deployable',
    where: (config, linked) => (
      config.provider === linked.provider && config.region === linked.region
    ),
    handler: (prov: AwsProviderProvisionable<'deployable'>): KmsKey => (
      prov.provisions.kmsKey
    ),
  },
  providerInstance: {
    from: SERVICE_TYPE.PROVIDER,
    scope: 'deployable',
    where: (config, linked) => (
      config.provider === linked.provider && config.region === linked.region
    ),
    handler: (prov: AwsProviderProvisionable<'deployable'>): AwsProvider => (
      prov.provisions.provider
    ),
  },
};

/**
 * @returns {AwsSecretsVaultService} the secrets vault service
 */
export const getSecretsVaultService = (): AwsSecretsVaultService => {
  return pipe(
    associate(associations),
    withRegions(REGIONS, DEFAULT_REGION),
    profilable(),
    // withHandler('deployable', onDeployment),
  )(getCoreService(PROVIDER.AWS, SERVICE_TYPE.SECRETS))
};
