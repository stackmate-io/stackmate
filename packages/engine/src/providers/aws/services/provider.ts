import { KmsKey } from '@cdktf/provider-aws/lib/kms';
import { InternetGateway, Subnet, Vpc } from '@cdktf/provider-aws/lib/vpc';
import { AwsProvider as TerraformAwsProvider } from '@cdktf/provider-aws';

import { ChoiceOf } from '@stackmate/engine/lib';
import { REGIONS } from '@stackmate/engine/providers/aws/constants';
import { PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';
import {
  CoreServiceAttributes, Provisionable, ProvisionAssociationRequirements,
  RegionalAttributes, Service,
} from '@stackmate/engine/core/service';

type AwsProviderCommonResources = {
  provider: TerraformAwsProvider;
};

type AwsProviderDeployableResources = AwsProviderCommonResources & {
  provider: TerraformAwsProvider,
  gateway: InternetGateway;
  subnet: Subnet;
  vpc: Vpc;
  kmsKey: KmsKey;
};

type AwsProviderDestroyableProvisions = AwsProviderCommonResources;
type AwsProviderPreparableProvisions = AwsProviderCommonResources;

export type AwsProviderAttributes = CoreServiceAttributes
  & RegionalAttributes<ChoiceOf<typeof REGIONS>>
  & {
    provider: typeof PROVIDER.AWS,
    type: typeof SERVICE_TYPE.PROVIDER;
    region: ChoiceOf<typeof REGIONS>;
  };

export type AwsProviderService = Service<AwsProviderAttributes> & {
  provider: typeof PROVIDER.AWS,
  type: typeof SERVICE_TYPE.PROVIDER;
};

type AwsProviderBaseProvisionable = Provisionable & {
  id: string;
  config: AwsProviderAttributes;
  service: AwsProviderService;
};

export type AwsProviderDeployableProvisionable = AwsProviderBaseProvisionable & {
  provisions: AwsProviderDeployableResources;
  requirements: ProvisionAssociationRequirements<AwsProviderService['associations'], 'deployable'>;
};

export type AwsProviderDestroyableProvisionable = AwsProviderBaseProvisionable & {
  provisions: AwsProviderDestroyableProvisions;
  requirements: ProvisionAssociationRequirements<AwsProviderService['associations'], 'destroyable'>;
};

export type AwsProviderPreparableProvisionable = AwsProviderBaseProvisionable & {
  provisions: AwsProviderPreparableProvisions;
  requirements: ProvisionAssociationRequirements<AwsProviderService['associations'], 'preparable'>;
};
