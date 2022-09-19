import { KmsKey } from '@cdktf/provider-aws/lib/kms';
import { InternetGateway, Subnet, Vpc } from '@cdktf/provider-aws/lib/vpc';
import { AwsProvider as TerraformAwsProvider } from '@cdktf/provider-aws';

import { ChoiceOf } from '@stackmate/engine/lib';
import { REGIONS } from '@stackmate/engine/providers/aws/constants';
import { PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';
import {
  CoreServiceAttributes, Provisionable, RegionalAttributes,
  Service, ServiceScopeChoice,
} from '@stackmate/engine/core/service';

export type AwsProviderCommonResources = {
  provider: TerraformAwsProvider,
};

export type AwsProviderDeployableResources = AwsProviderCommonResources & {
  gateway: InternetGateway;
  subnet: Subnet;
  vpc: Vpc;
  kmsKey: KmsKey;
};

export type AwsProviderDestroyableProvisions = AwsProviderCommonResources;
export type AwsProviderPreparableProvisions = AwsProviderCommonResources;

export type AwsProviderAttributes = CoreServiceAttributes
  & RegionalAttributes<ChoiceOf<typeof REGIONS>>
  & {
    provider: typeof PROVIDER.AWS,
    type: typeof SERVICE_TYPE.PROVIDER;
  };

export type AwsProviderService = Service<AwsProviderAttributes>;

type ProvisionablesPerScope<S extends ServiceScopeChoice> = S extends 'deployable'
  ? AwsProviderDeployableResources
  : S extends 'destroyable'
    ? AwsProviderDestroyableProvisions
    : S extends 'preparable'
      ? AwsProviderPreparableProvisions
      : never;

export type AwsProviderProvisionable<S extends ServiceScopeChoice> = Provisionable & {
  id: string;
  config: AwsProviderAttributes;
  service: AwsProviderService;
  requirements: {},
  provisions: ProvisionablesPerScope<S>;
};
