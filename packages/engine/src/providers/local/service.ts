import { PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';
import { BaseServiceAttributes, ServiceAssociation, ServiceScopeChoice } from '@stackmate/engine/core/service';

// type ProviderAssociation<S extends ServiceScopeChoice> = ServiceAssociation<
//   'providerInstance', typeof SERVICE_TYPE.PROVIDER, S, AwsProvider
// >;

export type LocalServiceAttributes<Attrs extends BaseServiceAttributes> = Attrs & {
  provider: typeof PROVIDER.LOCAL;
};
