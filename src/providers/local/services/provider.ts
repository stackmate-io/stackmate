import pipe from 'lodash/fp/pipe';
import { provider as terraformLocalProvider } from '@cdktf/provider-local';

import { Stack } from '@core/stack';
import { PROVIDER, SERVICE_TYPE } from '@constants';
import { LocalServiceAttributes } from '@providers/local/service';
import {
  BaseServiceAttributes, getCoreService, Provisionable, Service, withHandler,
} from '@core/service';

export type ProviderInstanceResources = {
  provider: terraformLocalProvider.LocalProvider;
};

export type LocalProviderAttributes = LocalServiceAttributes<BaseServiceAttributes & {
  type: typeof SERVICE_TYPE.PROVIDER;
}>;

export type LocalProviderResources = ProviderInstanceResources;
export type LocalProviderService = Service<LocalProviderAttributes>;
export type LocalProviderProvisionable = Provisionable<
  LocalProviderService, LocalProviderResources, 'preparable'
>;

export const onPrepare = (
  provisionable: LocalProviderProvisionable, stack: Stack,
): LocalProviderResources => {
  const provider = new terraformLocalProvider.LocalProvider(
    stack.context, provisionable.resourceId, { alias: `local-provider` },
  );

  return { provider };
};

/**
 * @returns {AwsProviderService} the secrets vault service
 */
export const getProviderService = (): LocalProviderService => (
  pipe(
    withHandler('preparable', onPrepare),
  )(getCoreService(PROVIDER.LOCAL, SERVICE_TYPE.PROVIDER))
);

export const LocalProvider = getProviderService();
