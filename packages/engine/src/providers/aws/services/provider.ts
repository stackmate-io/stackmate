import pipe from '@bitty/pipe';
import { kebabCase } from 'lodash';
import { KmsKey } from '@cdktf/provider-aws/lib/kms';
import { InternetGateway, Subnet, Vpc } from '@cdktf/provider-aws/lib/vpc';
import { AwsProvider as TerraformAwsProvider } from '@cdktf/provider-aws';

import { Stack } from '@stackmate/engine/core/stack';
import { getServiceProfile } from '@stackmate/engine/core/profile';
import { AwsServiceAttributes } from '@stackmate/engine/providers/aws/service';
import { ChoiceOf, getCidrBlocks } from '@stackmate/engine/lib';
import { DEFAULT_REGION, DEFAULT_VPC_IP, REGIONS } from '@stackmate/engine/providers/aws/constants';
import { DEFAULT_PROFILE_NAME, DEFAULT_RESOURCE_COMMENT, PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';
import {
  BaseServiceAttributes, getCoreService, profilable, Provisionable,
  ProvisionAssociationRequirements, RegionalAttributes, Service, withHandler, withRegions,
} from '@stackmate/engine/core/service';

export type ProviderPrerequisites = {
  provider: TerraformAwsProvider;
  kmsKey: KmsKey;
}

export type AwsProviderDeployableResources = ProviderPrerequisites & {
  gateway: InternetGateway;
  subnets: Subnet[];
  vpc: Vpc;
};

export type AwsProviderPreparableResources = ProviderPrerequisites;
export type AwsProviderDestroyableResources = ProviderPrerequisites;

export type AwsProviderAttributes = AwsServiceAttributes<BaseServiceAttributes
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

export type AwsProviderPreparableProvisionable = AwsProviderBaseProvisionable & {
  provisions: AwsProviderPreparableResources;
  requirements: ProvisionAssociationRequirements<AwsProviderService['associations'], 'preparable'>;
};

export type AwsProviderDestroyableProvisionable = AwsProviderBaseProvisionable & {
  provisions: AwsProviderDestroyableResources;
  requirements: ProvisionAssociationRequirements<AwsProviderService['associations'], 'destroyable'>;
};

/**
 * Registers the prerequisites required by all operation types
 *
 * @param {AwsProviderBaseProvisionable} provisionable the provisionable item
 * @param {Stack} stack the stack to deploy resources to
 * @returns {ProviderPrerequisites} the provider prerequisite resources
 */
export const registerPrerequisites = (
  provisionable: AwsProviderBaseProvisionable, stack: Stack,
): ProviderPrerequisites => {
  const { config: { region }, resourceId } = provisionable;
  const alias = `aws-${kebabCase(region)}-provider`;
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

  const kmsKey = new KmsKey(stack.context, `${resourceId}-key`, {
    customerMasterKeySpec: 'SYMMETRIC_DEFAULT',
    deletionWindowInDays: 30,
    description: 'Stackmate default encryption key',
    enableKeyRotation: false,
    isEnabled: true,
    keyUsage: 'ENCRYPT_DECRYPT',
    multiRegion: false,
  });

  return { provider, kmsKey };
};

/**
 * @param {AwsProviderDeployableProvisionable} provisionable the provisionable item
 * @param {Stack} stack the stack to deploy resources to
 * @returns {AwsProviderDeployableResources} the resources deployed by the AWS provider
 */
export const onDeploy = (
  provisionable: AwsProviderDeployableProvisionable, stack: Stack,
): AwsProviderDeployableResources => {
  const { config, resourceId } = provisionable;
  const [vpcCidr, ...subnetCidrs] = getCidrBlocks(config.ip || DEFAULT_VPC_IP, 16, 2, 24);
  const {
    vpc: vpcConfig,
    subnet: subnetConfig,
    gateway: gatewayConfig,
  } = getServiceProfile(PROVIDER.AWS, SERVICE_TYPE.PROVIDER, DEFAULT_PROFILE_NAME);

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

  return {
    ...registerPrerequisites(provisionable, stack),
    vpc,
    subnets,
    gateway,
  };
};

/**
 * @returns {AwsProviderService} the secrets vault service
 */
export const getProviderService = (): AwsProviderService => (
  pipe(
    profilable(),
    withRegions(REGIONS, DEFAULT_REGION),
    withHandler('deployable', onDeploy),
    withHandler('preparable', registerPrerequisites),
    withHandler('destroyable', registerPrerequisites),
  )(getCoreService(PROVIDER.AWS, SERVICE_TYPE.PROVIDER))
);

export const AwsProvider = getProviderService();
