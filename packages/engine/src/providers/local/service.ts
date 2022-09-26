import { PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';
import { BaseServiceAttributes, ServiceAssociation, ServiceScopeChoice } from '@stackmate/engine/core/service';
import { LocalProviderService } from './services/provider';

type ProviderAssociation<S extends ServiceScopeChoice> = ServiceAssociation<
  'providerInstance', typeof SERVICE_TYPE.PROVIDER, S, LocalProviderService
>;

export type LocalServiceAssociations = [
  ProviderAssociation<'preparable'>,
];

export type LocalServiceAttributes<Attrs extends BaseServiceAttributes> = Attrs & {
  provider: typeof PROVIDER.LOCAL;
};

export type LocalService<Attrs extends BaseServiceAttributes> = Attrs & {
  provider: typeof PROVIDER.LOCAL;
};
