import pipe from '@bitty/pipe';
import { provider as terraformLocalProvider } from '@cdktf/provider-local';

import { PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';
import { LocalProviderAttributes, LocalProviderProvisionable } from '@stackmate/engine/providers/local/services/provider';
import {
  associate, BaseServiceAttributes, getCoreService, Service, ServiceAssociations,
  ServiceRequirement, ServiceTypeChoice,
} from '@stackmate/engine/core/service';

type ProviderRequirement = ServiceRequirement<
  terraformLocalProvider.LocalProvider, typeof SERVICE_TYPE.PROVIDER
>;

export type LocalServiceAssociations = {
  preparable: {
    providerInstance: ProviderRequirement;
  };
};

export type LocalServiceAttributes<Attrs extends BaseServiceAttributes> = Attrs & {
  provider: typeof PROVIDER.LOCAL;
};

export type LocalService<
  Attrs extends BaseServiceAttributes,
  Assocs extends ServiceAssociations = {},
> = Service<LocalServiceAttributes<Attrs>, LocalServiceAssociations & Assocs>;

/**
 * @var {LocalServiceAssociations} associations Service Associations applied to all local services
 */
const associations: LocalServiceAssociations = {
  preparable: {
    providerInstance: {
      from: SERVICE_TYPE.PROVIDER,
      requirement: true,
      where: (config: LocalProviderAttributes, linked: BaseServiceAttributes) => (
        config.provider === linked.provider
      ),
      handler: (p: LocalProviderProvisionable): terraformLocalProvider.LocalProvider => {
        return p.provisions.provider
      },
    },
  },
};

export const getLocalService = (type: ServiceTypeChoice) => (
  pipe(
    associate(associations),
  )(getCoreService(PROVIDER.LOCAL, type))
);
