import pipe from '@bitty/pipe';
import { LocalProvider as TerraformLocalProvider } from '@cdktf/provider-local';

import { PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';
import { LocalProviderAttributes, LocalProviderProvisionable } from '@stackmate/engine/providers/local/services/provider';
import {
  associate, BaseServiceAttributes, getCoreService, ServiceAssociation,
  ServiceScopeChoice, ServiceTypeChoice,
} from '@stackmate/engine/core/service';

type ProviderAssociation<S extends ServiceScopeChoice> = ServiceAssociation<
  'providerInstance', typeof SERVICE_TYPE.PROVIDER, S, TerraformLocalProvider
>;

export type LocalServiceAssociations = [
  ProviderAssociation<'preparable'>,
];

export type LocalServiceAttributes<Attrs extends BaseServiceAttributes> = Attrs & {
  provider: typeof PROVIDER.LOCAL;
};

const associations: LocalServiceAssociations = [{
  as: 'providerInstance',
  from: SERVICE_TYPE.PROVIDER,
  scope: 'preparable',
  where: (config: LocalProviderAttributes, linked: BaseServiceAttributes) => (
    config.provider === linked.provider
  ),
  handler: (p: LocalProviderProvisionable): TerraformLocalProvider => {
    return p.provisions.provider
  },
}];

export const getLocalService = (type: ServiceTypeChoice) => (
  pipe(
    associate(associations),
  )(getCoreService(PROVIDER.LOCAL, type))
);
