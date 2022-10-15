import pipe from '@bitty/pipe';
import { provider as terraformLocalProvider } from '@cdktf/provider-local';

import { PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';
import { LocalProviderAttributes, LocalProviderProvisionable } from '@stackmate/engine/providers/local/services/provider';
import {
  associate, BaseServiceAttributes, getCoreService, ServiceRequirement,
  ServiceScopeChoice, ServiceTypeChoice,
} from '@stackmate/engine/core/service';

type ProviderRequirement<Scope extends ServiceScopeChoice> = ServiceRequirement<
  'providerInstance', Scope, terraformLocalProvider.LocalProvider, typeof SERVICE_TYPE.PROVIDER
>;

export type LocalServiceRequirements = [
  ProviderRequirement<'preparable'>,
];

export type LocalServiceAttributes<Attrs extends BaseServiceAttributes> = Attrs & {
  provider: typeof PROVIDER.LOCAL;
};

const associations: LocalServiceRequirements = [{
  as: 'providerInstance',
  from: SERVICE_TYPE.PROVIDER,
  scope: 'preparable',
  requirement: true,
  where: (config: LocalProviderAttributes, linked: BaseServiceAttributes) => (
    config.provider === linked.provider
  ),
  handler: (p: LocalProviderProvisionable): terraformLocalProvider.LocalProvider => {
    return p.provisions.provider
  },
}];

export const getLocalService = (type: ServiceTypeChoice) => (
  pipe(
    associate(associations),
  )(getCoreService(PROVIDER.LOCAL, type))
);
