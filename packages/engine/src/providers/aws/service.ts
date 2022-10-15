/**
 * This file contains associations and helpers for other services to associate with the AWS provider
 */
import pipe from '@bitty/pipe';
import { kmsKey, provider as terraformAwsProvider } from '@cdktf/provider-aws';

import { ChoiceOf, OneOfType } from '@stackmate/engine/lib';
import { PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';
import { DEFAULT_REGION, REGIONS } from '@stackmate/engine/providers/aws/constants';
import {
  associate, BaseService, BaseServiceAttributes, getCloudService, getCoreService,
  ServiceRequirement, ServiceScopeChoice, ServiceTypeChoice, withRegions,
} from '@stackmate/engine/core/service';
import {
  AwsProviderAttributes,
  AwsProviderDeployableProvisionable,
  AwsProviderDestroyableProvisionable,
  AwsProviderPreparableProvisionable,
} from '@stackmate/engine/providers/aws/services/provider';

type ProviderAssociation<Scope extends ServiceScopeChoice> = ServiceRequirement<
  'providerInstance', Scope, terraformAwsProvider.AwsProvider, typeof SERVICE_TYPE.PROVIDER
>;

type KmsKeyAssociation<Scope extends ServiceScopeChoice> = ServiceRequirement<
  'kmsKey', Scope, kmsKey.KmsKey, typeof SERVICE_TYPE.PROVIDER
>;

export type AwsServiceAssociations = [
  ProviderAssociation<'deployable'>,
  ProviderAssociation<'destroyable'>,
  ProviderAssociation<'preparable'>,
  KmsKeyAssociation<'deployable'>,
  KmsKeyAssociation<'destroyable'>,
  KmsKeyAssociation<'preparable'>,
];

export type AwsServiceAttributes<Attrs extends BaseServiceAttributes> = Attrs & {
  provider: typeof PROVIDER.AWS;
  region: ChoiceOf<typeof REGIONS>;
};

type ProviderProvisionable = OneOfType<[
  AwsProviderDeployableProvisionable,
  AwsProviderDestroyableProvisionable,
  AwsProviderPreparableProvisionable,
]>;

const getProviderInstanceRequirement = <S extends ServiceScopeChoice>(
  scope: S,
): ProviderAssociation<S> => ({
  as: 'providerInstance',
  from: SERVICE_TYPE.PROVIDER,
  scope,
  requirement: true,
  where: (config: AwsProviderAttributes, linked: BaseServiceAttributes) => (
    config.provider === linked.provider && config.region === linked.region
  ),
  handler: (p: ProviderProvisionable): terraformAwsProvider.AwsProvider => (
    p.provisions.provider
  ),
});

const getKmsKeyRequirement = <S extends ServiceScopeChoice>(
  scope: S,
): KmsKeyAssociation<S> => ({
  as: 'kmsKey',
  from: SERVICE_TYPE.PROVIDER,
  scope,
  requirement: true,
  where: (config: BaseServiceAttributes, linked: BaseServiceAttributes) => (
    config.provider === linked.provider && config.region === linked.region
  ),
  handler: (
    prov: AwsProviderDeployableProvisionable | AwsProviderPreparableProvisionable,
  ): kmsKey.KmsKey => (
    prov.provisions.kmsKey
  ),
});

const associations: AwsServiceAssociations = [
  getProviderInstanceRequirement('deployable'),
  getProviderInstanceRequirement('destroyable'),
  getProviderInstanceRequirement('preparable'),
  getKmsKeyRequirement('deployable'),
  getKmsKeyRequirement('destroyable'),
  getKmsKeyRequirement('preparable'),
];

const getAwsService = (srv: BaseService) => (
  pipe(
    associate(associations),
    withRegions(REGIONS, DEFAULT_REGION),
  )(srv)
);

export const getAwsCoreService = (type: ServiceTypeChoice) => (
  getAwsService(getCoreService(PROVIDER.AWS, type))
);

export const getAwsCloudService = (type: ServiceTypeChoice) => (
  getAwsService(getCloudService(PROVIDER.AWS, type))
);
