import pipe from '@bitty/pipe';
import { LocalProvider as TerraformLocalProvider } from '@cdktf/provider-local';

import { Stack } from '@stackmate/engine/core/stack';
import { PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';
import { LocalServiceAttributes } from '@stackmate/engine/providers/local/service';
import {
  BaseServiceAttributes, getCoreService, Provisionable,
  ProvisionAssociationRequirements, Service, withHandler,
} from '@stackmate/engine/core/service';

export type ProviderInstanceResources = {
  provider: TerraformLocalProvider;
};

export type LocalProviderAttributes = LocalServiceAttributes<BaseServiceAttributes & {
  type: typeof SERVICE_TYPE.PROVIDER;
}>;

export type LocalProviderResources = ProviderInstanceResources;
export type LocalProviderService = Service<LocalProviderAttributes>;

export type LocalProviderProvisionable = Provisionable & {
  config: LocalProviderAttributes;
  service: LocalProviderService;
  provisions: LocalProviderResources;
  requirements: ProvisionAssociationRequirements<
    LocalProviderService['associations'], 'preparable'
  >;
};

export const onPrepare = (
  provisionable: LocalProviderProvisionable, stack: Stack,
): LocalProviderResources => {
  const provider = new TerraformLocalProvider(stack.context, provisionable.resourceId, {
    alias: `local-provider`,
  });

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
