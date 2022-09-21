import pipe from '@bitty/pipe';
import { KmsKey } from '@cdktf/provider-aws/lib/kms';
import { InternetGateway, Subnet, Vpc } from '@cdktf/provider-aws/lib/vpc';
import { AwsProvider as TerraformAwsProvider } from '@cdktf/provider-aws';

import { ChoiceOf } from '@stackmate/engine/lib';
import { DEFAULT_REGION, REGIONS } from '@stackmate/engine/providers/aws/constants';
import { PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';
import { AwsServiceAttributes } from '@stackmate/engine/providers/aws/services/core';
import {
  CoreServiceAttributes, getCoreService, profilable, ProfilableAttributes, Provisionable, ProvisionAssociationRequirements,
  RegionalAttributes, Service, withRegions,
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

export type AwsProviderAttributes = AwsServiceAttributes<CoreServiceAttributes
  & ProfilableAttributes
  & RegionalAttributes<ChoiceOf<typeof REGIONS>>
  & { type: typeof SERVICE_TYPE.PROVIDER }
>;

export type AwsProviderService = Service<AwsProviderAttributes>;

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

/**
 * @returns {AwsSecretsVaultService} the secrets vault service
 */
export const getProviderService = (): AwsProviderService => (
  pipe(
    profilable(),
    withRegions(REGIONS, DEFAULT_REGION),
  )(getCoreService(PROVIDER.AWS, SERVICE_TYPE.PROVIDER))
);

export const AwsProvider = getProviderService();
