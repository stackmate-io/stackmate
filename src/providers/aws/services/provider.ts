import pipe from 'lodash/fp/pipe'
import { kebabCase } from 'lodash'
import { TerraformOutput } from 'cdktf'
import {
  internetGateway,
  kmsKey as awsKmsKey,
  subnet as awsSubnet,
  vpc as awsVpc,
  provider as awsProvider,
  dataAwsCallerIdentity as callerIdentity,
} from '@cdktf/provider-aws'
import { getResourcesProfile } from '@core/profile'
import { getCidrBlocks } from '@lib/networking'
import { DEFAULT_REGION, DEFAULT_VPC_IP, REGIONS } from '@providers/aws/constants'
import { DEFAULT_RESOURCE_COMMENT, PROVIDER, SERVICE_TYPE } from '@constants'
import {
  getBaseService,
  profilable,
  withEnvironment,
  withHandler,
  withRegions,
} from 'src/services/behaviors'
import type { Stack } from '@lib/stack'
import type { ChoiceOf } from '@lib/util'
import type { Provisionable } from '@core/provision'
import type { AwsServiceAttributes } from '@providers/aws/service'
import type { BaseServiceAttributes } from 'src/services/types'
import type { RegionalAttributes, Service } from 'src/services/behaviors'

export type AwsProviderResources = {
  provider: awsProvider.AwsProvider
  kmsKey: awsKmsKey.KmsKey
  account: callerIdentity.DataAwsCallerIdentity
  outputs: TerraformOutput[]
  gateway: internetGateway.InternetGateway
  subnets: awsSubnet.Subnet[]
  vpc: awsVpc.Vpc
}

export type AwsProviderAttributes = AwsServiceAttributes<
  BaseServiceAttributes &
    RegionalAttributes<ChoiceOf<typeof REGIONS>> & {
      type: typeof SERVICE_TYPE.PROVIDER
      rootIp?: string
    }
>

export type AwsProviderService = Service<AwsProviderAttributes>
export type AwsProviderProvisionable = Provisionable<AwsProviderService, AwsProviderResources>

/**
 * @param {AwsProviderProvisionable} provisionable the provisionable item
 * @param {Stack} stack the stack to deploy resources to
 * @returns {AwsProviderResources} the resources deployed by the AWS provider
 */
export const resourceHandler = (
  provisionable: AwsProviderProvisionable,
  stack: Stack,
): AwsProviderResources => {
  const {
    config,
    config: { region },
    resourceId,
  } = provisionable

  const {
    vpc: vpcConfig,
    subnet: subnetConfig,
    gateway: gatewayConfig,
  } = getResourcesProfile(config)

  const [vpcCidr, ...subnetCidrs] = getCidrBlocks(config.rootIp || DEFAULT_VPC_IP, 16, 2, 24)

  const provider = new awsProvider.AwsProvider(stack.context, PROVIDER.AWS, {
    region,
    alias: `aws-${kebabCase(region)}-provider`,
    defaultTags: [
      {
        tags: {
          Environment: stack.name,
          Description: DEFAULT_RESOURCE_COMMENT,
        },
      },
    ],
  })

  const kmsKey = new awsKmsKey.KmsKey(stack.context, `${resourceId}-key`, {
    customerMasterKeySpec: 'SYMMETRIC_DEFAULT',
    deletionWindowInDays: 30,
    description: 'Stackmate default encryption key',
    enableKeyRotation: false,
    isEnabled: true,
    keyUsage: 'ENCRYPT_DECRYPT',
    multiRegion: false,
  })

  const account = new callerIdentity.DataAwsCallerIdentity(
    stack.context,
    `${resourceId}-account-id`,
    {
      provider,
    },
  )

  const vpc = new awsVpc.Vpc(stack.context, resourceId, {
    ...vpcConfig,
    cidrBlock: vpcCidr,
  })

  const subnets = subnetCidrs.map(
    (cidrBlock, idx) =>
      new awsSubnet.Subnet(stack.context, `${resourceId}-subnet${idx + 1}`, {
        ...subnetConfig,
        vpcId: vpc.id,
        cidrBlock,
      }),
  )

  const gateway = new internetGateway.InternetGateway(stack.context, `${resourceId}-gateway`, {
    ...gatewayConfig,
    vpcId: vpc.id,
  })

  const outputs: TerraformOutput[] = [
    new TerraformOutput(stack.context, `${resourceId}-vpc-id`, {
      description: 'VPC ID',
      value: vpc.id,
    }),
    new TerraformOutput(stack.context, `${resourceId}-vpc-cidr-block`, {
      description: 'VPC CIDR block',
      value: vpc.cidrBlock,
    }),
  ]

  return {
    provider,
    kmsKey,
    account,
    vpc,
    subnets,
    gateway,
    outputs,
  }
}

/**
 * @returns {AwsProviderService} the secrets vault service
 */
export const getProviderService = (): AwsProviderService =>
  pipe(
    profilable(),
    withRegions(REGIONS, DEFAULT_REGION),
    withHandler(resourceHandler),
    withEnvironment('AWS_ACCESS_KEY_ID', 'AWS Access Key ID', true),
    withEnvironment('AWS_SECRET_ACCESS_KEY', 'AWS Secret Access Key', true),
  )(getBaseService(PROVIDER.AWS, SERVICE_TYPE.PROVIDER))

export const AwsProvider = getProviderService()
