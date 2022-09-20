/**
 * This file contains associations and helpers for other services to associate with the AWS provider
 */
import pipe from '@bitty/pipe';
import { KmsKey } from '@cdktf/provider-aws/lib/kms';
import { AwsProvider } from '@cdktf/provider-aws';

import { ChoiceOf, OneOfType } from '@stackmate/engine/lib';
import { PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';
import {
  associate, BaseService, BaseServiceAttributes, getCloudService, getCoreService,
  Service, ServiceAssociation, ServiceScopeChoice, ServiceTypeChoice, withRegions,
} from '@stackmate/engine/core/service';
import {
  AwsProviderAttributes,
  AwsProviderDeployableProvisionable,
  AwsProviderDestroyableProvisionable,
  AwsProviderPreparableProvisionable,
} from '@stackmate/engine/providers/aws/services/provider';
import { DEFAULT_REGION, REGIONS } from '../constants';

type ProviderAssociation<S extends ServiceScopeChoice> = ServiceAssociation<'providerInstance', typeof SERVICE_TYPE.PROVIDER, S, AwsProvider>;
type KmsKeyAssociation<S extends ServiceScopeChoice> = ServiceAssociation<'kmsKey', typeof SERVICE_TYPE.PROVIDER, S, KmsKey>;

export type AwsServiceAssociations = [
  ProviderAssociation<'deployable'>,
  ProviderAssociation<'destroyable'>,
  ProviderAssociation<'preparable'>,
  KmsKeyAssociation<'deployable'>,
];

export type AwsServiceAttributes<Attrs extends BaseServiceAttributes> = Attrs & {
  provider: typeof PROVIDER.AWS;
  region: ChoiceOf<typeof REGIONS>;
};

export type AwsService<Attrs extends BaseServiceAttributes> = Service<Attrs> & {
  associations: AwsServiceAssociations;
};

type ProviderProvisionable = OneOfType<[
  AwsProviderDeployableProvisionable,
  AwsProviderDestroyableProvisionable,
  AwsProviderPreparableProvisionable,
]>;

const getProviderInstanceAssociation = <S extends ServiceScopeChoice>(scope: S): ProviderAssociation<S> => ({
  as: 'providerInstance',
  from: SERVICE_TYPE.PROVIDER,
  scope,
  where: (config: AwsProviderAttributes, linked: BaseServiceAttributes) => (
    config.provider === linked.provider && config.region === linked.region
  ),
  handler: (p: ProviderProvisionable): AwsProvider => {
    return p.provisions.provider
  },
});

const associations: AwsServiceAssociations = [
  getProviderInstanceAssociation('deployable'),
  getProviderInstanceAssociation('destroyable'),
  getProviderInstanceAssociation('preparable'),
  {
    as: 'kmsKey',
    from: SERVICE_TYPE.PROVIDER,
    scope: 'deployable',
    where: (config: BaseServiceAttributes, linked: BaseServiceAttributes) => (
      config.provider === linked.provider && config.region === linked.region
    ),
    handler: (prov: AwsProviderDeployableProvisionable): KmsKey => (
      prov.provisions.kmsKey
    ),
  },
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
