import pipe from '@bitty/pipe';
import { kebabCase } from 'lodash';
import { KmsKey } from '@cdktf/provider-aws/lib/kms';
import { InternetGateway, Subnet, Vpc } from '@cdktf/provider-aws/lib/vpc';
import { AwsProvider as TerraformAwsProvider } from '@cdktf/provider-aws';

import { Stack } from '@stackmate/engine/core/stack';
import { getServiceProfile } from '@stackmate/engine/core/profile';
import { ChoiceOf, getCidrBlocks } from '@stackmate/engine/lib';
import { DEFAULT_REGION, DEFAULT_VPC_IP, REGIONS } from '@stackmate/engine/providers/aws/constants';
import { DEFAULT_PROFILE_NAME, DEFAULT_RESOURCE_COMMENT, PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';
import { AwsServiceAttributes } from '@stackmate/engine/providers/aws/service';
import {
  BaseServiceAttributes, getCoreService, profilable, ProfilableAttributes, Provisionable,
  ProvisionAssociationRequirements, RegionalAttributes, Service, withHandler, withRegions,
} from '@stackmate/engine/core/service';

export type AwsProviderCommonResources = {
  provider: TerraformAwsProvider;
};

export type AwsProviderDeployableResources = AwsProviderCommonResources & {
  provider: TerraformAwsProvider,
  gateway: InternetGateway;
  subnets: Subnet[];
  vpc: Vpc;
  kmsKey: KmsKey;
};

export type AwsProviderDestroyableProvisions = AwsProviderCommonResources;
export type AwsProviderPreparableProvisions = AwsProviderCommonResources;

export type AwsProviderAttributes = AwsServiceAttributes<BaseServiceAttributes
  & ProfilableAttributes
  & RegionalAttributes<ChoiceOf<typeof REGIONS>>
  & { type: typeof SERVICE_TYPE.PROVIDER; ip?: string; }
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
 * Registers base provisions required by all handlers
 *
 * @param {AwsProviderDestroyableProvisionable} provisionable the provisionable item
 * @param {Stack} stack the stack to deploy resources to
 * @returns {AwsProviderCommonResources} the common resources provisioned by the AWS provider
 */
export const registerBaseProvisions = (
  provisionable: AwsProviderBaseProvisionable, stack: Stack,
): AwsProviderCommonResources => {
  const { config: { region } } = provisionable;
  const alias = `aws-${kebabCase(region)}`;
  const provider = new TerraformAwsProvider(stack.context, PROVIDER.AWS, {
    region,
    alias,
    defaultTags: {
      tags: {
        Environment: stack.stageName,
        Description: DEFAULT_RESOURCE_COMMENT,
      },
    },
  });

  return { provider };
};

/**
 * @param {AwsProviderDestroyableProvisionable} provisionable the provisionable item
 * @param {Stack} stack the stack to deploy resources to
 * @returns {AwsProviderDeployableResources} the resources deployed by the AWS provider
 */
export const onDeployment = (
  provisionable: AwsProviderDestroyableProvisionable, stack: Stack,
): AwsProviderDeployableResources => {
  const { config, resourceId } = provisionable;
  const { provider } = registerBaseProvisions(provisionable, stack);
  const [vpcCidr, ...subnetCidrs] = getCidrBlocks(config.ip || DEFAULT_VPC_IP, 16, 2, 24);
  const { vpc: vpcConfig, subnet: subnetConfig, gateway: gatewayConfig } = getServiceProfile(
    PROVIDER.AWS, SERVICE_TYPE.PROVIDER, config.profile || DEFAULT_PROFILE_NAME,
  );

  const vpc = new Vpc(stack.context, resourceId, {
    ...vpcConfig,
    cidrBlock: vpcCidr,
  });

  const subnets = subnetCidrs.map((cidrBlock, idx) => (
    new Subnet(stack.context, `${resourceId}-subnet${(idx + 1)}`, {
      ...subnetConfig,
      vpcId: vpc.id,
      cidrBlock,
    })
  ));

  const gateway = new InternetGateway(stack.context, `${resourceId}-gateway`, {
    ...gatewayConfig,
    vpcId: vpc.id,
  });;

  const kmsKey = new KmsKey(stack.context, `${resourceId}-key`, {
    customerMasterKeySpec: 'SYMMETRIC_DEFAULT',
    deletionWindowInDays: 30,
    description: 'Stackmate default encryption key',
    enableKeyRotation: false,
    isEnabled: true,
    keyUsage: 'ENCRYPT_DECRYPT',
    multiRegion: false,
  });

  return {
    provider,
    vpc,
    subnets,
    gateway,
    kmsKey,
  };
};

/**
 * @returns {AwsSecretsVaultService} the secrets vault service
 */
export const getProviderService = (): AwsProviderService => (
  pipe(
    profilable(),
    withRegions(REGIONS, DEFAULT_REGION),
    withHandler('deployable', onDeployment),
    withHandler('destroyable', registerBaseProvisions),
    withHandler('preparable', registerBaseProvisions),
  )(getCoreService(PROVIDER.AWS, SERVICE_TYPE.PROVIDER))
);

export const AwsProvider = getProviderService();
