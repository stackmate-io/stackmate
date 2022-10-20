import pipe from '@bitty/pipe';
import { kebabCase } from 'lodash';
import {
  internetGateway,
  kmsKey as awsKmsKey,
  subnet as awsSubnet,
  vpc as awsVpc,
  provider as awsProvider,
  dataAwsCallerIdentity as callerIdentity,
} from '@cdktf/provider-aws';

import { Stack } from '@stackmate/engine/core/stack';
import { getResourcesProfile } from '@stackmate/engine/core/profile';
import { AwsServiceAttributes } from '@stackmate/engine/providers/aws/service';
import { ChoiceOf, getCidrBlocks } from '@stackmate/engine/lib';
import { DEFAULT_REGION, DEFAULT_VPC_IP, REGIONS } from '@stackmate/engine/providers/aws/constants';
import { DEFAULT_RESOURCE_COMMENT, PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';
import {
  BaseServiceAttributes, getCoreService, profilable, Provisionable,
  RegionalAttributes, Service, withHandler, withRegions,
} from '@stackmate/engine/core/service';

export type ProviderPrerequisites = {
  provider: awsProvider.AwsProvider;
  kmsKey: awsKmsKey.KmsKey;
  account: callerIdentity.DataAwsCallerIdentity;
};

export type AwsProviderDeployableResources = ProviderPrerequisites & {
  gateway: internetGateway.InternetGateway;
  subnets: awsSubnet.Subnet[];
  vpc: awsVpc.Vpc;
};

export type AwsProviderPreparableResources = ProviderPrerequisites;
export type AwsProviderDestroyableResources = ProviderPrerequisites;

export type AwsProviderAttributes = AwsServiceAttributes<BaseServiceAttributes
  & RegionalAttributes<ChoiceOf<typeof REGIONS>>
  & {
    type: typeof SERVICE_TYPE.PROVIDER;
    rootIp?: string;
  }
>;

export type AwsProviderService = Service<AwsProviderAttributes>;

export type AwsProviderDeployableProvisionable = Provisionable<
  AwsProviderService, AwsProviderDeployableResources, 'deployable'
>;

export type AwsProviderPreparableProvisionable = Provisionable<
  AwsProviderService, AwsProviderPreparableResources, 'preparable'
>;

export type AwsProviderDestroyableProvisionable = Provisionable<
  AwsProviderService, AwsProviderDestroyableResources, 'destroyable'
>;

/**
 * Registers the prerequisites required by all operation types
 *
 * @param {AwsProviderBaseProvisionable} provisionable the provisionable item
 * @param {Stack} stack the stack to deploy resources to
 * @returns {ProviderPrerequisites} the provider prerequisite resources
 */
export const registerPrerequisites = (
  provisionable: AwsProviderPreparableProvisionable | AwsProviderDestroyableProvisionable,
  stack: Stack,
): ProviderPrerequisites => {
  const { config: { region }, resourceId } = provisionable;
  const alias = `aws-${kebabCase(region)}-provider`;
  const provider = new awsProvider.AwsProvider(stack.context, PROVIDER.AWS, {
    region,
    alias,
    defaultTags: {
      tags: {
        Environment: stack.stageName,
        Description: DEFAULT_RESOURCE_COMMENT,
      },
    },
  });

  const kmsKey = new awsKmsKey.KmsKey(stack.context, `${resourceId}-key`, {
    customerMasterKeySpec: 'SYMMETRIC_DEFAULT',
    deletionWindowInDays: 30,
    description: 'Stackmate default encryption key',
    enableKeyRotation: false,
    isEnabled: true,
    keyUsage: 'ENCRYPT_DECRYPT',
    multiRegion: false,
  });

  const account = new callerIdentity.DataAwsCallerIdentity(
    stack.context, `${resourceId}-account-id`, {
      provider,
    },
  );

  return { provider, kmsKey, account };
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
  const [vpcCidr, ...subnetCidrs] = getCidrBlocks(config.rootIp || DEFAULT_VPC_IP, 16, 2, 24);
  const {
    vpc: vpcConfig,
    subnet: subnetConfig,
    gateway: gatewayConfig,
  } = getResourcesProfile(config);

  const vpc = new awsVpc.Vpc(stack.context, resourceId, {
    ...vpcConfig,
    cidrBlock: vpcCidr,
  });

  const subnets = subnetCidrs.map((cidrBlock, idx) => (
    new awsSubnet.Subnet(stack.context, `${resourceId}-subnet${(idx + 1)}`, {
      ...subnetConfig,
      vpcId: vpc.id,
      cidrBlock,
    })
  ));

  const gateway = new internetGateway.InternetGateway(stack.context, `${resourceId}-gateway`, {
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
