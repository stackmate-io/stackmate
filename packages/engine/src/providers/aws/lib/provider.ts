import { KmsKey } from '@cdktf/provider-aws/lib/kms';
import { AwsProvider } from '@cdktf/provider-aws';
import { SERVICE_TYPE } from '@stackmate/engine/constants';
import { AwsProviderProvisionable } from '@stackmate/engine/providers/aws/services/provider';
import { BaseServiceAttributes, ServiceAssociation } from '@stackmate/engine/core/service';

export type AwsProviderAssociations = [
  ServiceAssociation<'kmsKey', typeof SERVICE_TYPE.PROVIDER, 'deployable', KmsKey>,
  ServiceAssociation<'providerInstance', typeof SERVICE_TYPE.PROVIDER, 'deployable', AwsProvider>,
];

export const getAwsProviderAssociations = (): AwsProviderAssociations => ([{
  as: 'kmsKey',
  from: SERVICE_TYPE.PROVIDER,
  scope: 'deployable',
  where: (config: BaseServiceAttributes, linked: BaseServiceAttributes) => (
    config.provider === linked.provider && config.region === linked.region
  ),
  handler: (prov: AwsProviderProvisionable<'deployable'>): KmsKey => (
    prov.provisions.kmsKey
  ),
}, {
  as: 'providerInstance',
  from: SERVICE_TYPE.PROVIDER,
  scope: 'deployable',
  where: (config, linked) => (
    config.provider === linked.provider && config.region === linked.region
  ),
  handler: (prov: AwsProviderProvisionable<S>): AwsProvider => (
    prov.provisions.provider
  ),
}]);
