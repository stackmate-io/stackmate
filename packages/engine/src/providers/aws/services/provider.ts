import { KmsKey } from '@cdktf/provider-aws/lib/kms';
import { InternetGateway, Subnet, Vpc } from '@cdktf/provider-aws/lib/vpc';
import { AwsProvider as TerraformAwsProvider } from '@cdktf/provider-aws';

import { ChoiceOf } from '@stackmate/engine/lib';
import { REGIONS } from '@stackmate/engine/providers/aws/constants';
import { CoreServiceAttributes, Provisionable, RegionalAttributes } from '@stackmate/engine/core/service';
import { PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';

export type AwsProviderCommonProvisions = {
  provider: TerraformAwsProvider,
};

export type AwsProviderDeployableProvisions = AwsProviderCommonProvisions & {
  gateway: InternetGateway;
  subnet: Subnet;
  vpc: Vpc;
  kmsKey: KmsKey;
};

export type AwsProviderDestroyableProvisions = AwsProviderCommonProvisions;
export type AwsProviderPreparableProvisions = AwsProviderCommonProvisions;

export type AwsProviderAttributes = CoreServiceAttributes
  & RegionalAttributes<ChoiceOf<typeof REGIONS>>
  & {
    provider: typeof PROVIDER.AWS,
    type: typeof SERVICE_TYPE.PROVIDER;
  };

export type AwsProviderProvisionable = Provisionable & {
  id: string;
  config: AwsProviderAttributes;
  service: {};
};
