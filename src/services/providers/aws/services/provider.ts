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
import { getCidrBlocks } from '@lib/networking'
import { getBaseService, getProfile } from '@services/utils'
import { DEFAULT_VPC_IP, REGIONS } from '@aws/constants'
import { DEFAULT_RESOURCE_COMMENT, PROVIDER, SERVICE_TYPE } from '@src/constants'
import { profileable, withEnvironment, withHandler, withRegions } from '@services/behaviors'
import type { Stack } from '@lib/stack'
import type { AwsProviderService, AwsProviderProvisionable, AwsProviderResources } from '@aws/types'

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

  const { vpc: vpcConfig, subnet: subnetConfig, gateway: gatewayConfig } = getProfile(config)

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

  const kmsKey = new awsKmsKey.KmsKey(stack.context, `${resourceId}_key`, {
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
    `${resourceId}_account_id`,
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
      new awsSubnet.Subnet(stack.context, `${resourceId}_subnet${idx + 1}`, {
        ...subnetConfig,
        vpcId: vpc.id,
        cidrBlock,
      }),
  )

  const gateway = new internetGateway.InternetGateway(stack.context, `${resourceId}_gateway`, {
    ...gatewayConfig,
    vpcId: vpc.id,
  })

  const outputs: TerraformOutput[] = [
    new TerraformOutput(stack.context, `${resourceId}_vpc_id`, {
      description: 'VPC ID',
      value: vpc.id,
    }),
    new TerraformOutput(stack.context, `${resourceId}_vpc_cidr_block`, {
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
    profileable(),
    withRegions(REGIONS),
    withHandler(resourceHandler),
    withEnvironment({
      AWS_ACCESS_KEY_ID: { description: 'AWS Secret Key ID', required: true },
      AWS_SECRET_ACCESS_KEY: { description: 'AWS Secret Access Key', required: true },
      AWS_KMS_KEY_ARN: { description: 'AWS KMS key ARN', required: true },
    }),
  )(getBaseService(PROVIDER.AWS, SERVICE_TYPE.PROVIDER))

export const AwsProvider = getProviderService()

export const AwsProviderDeployment = getProviderService()
export const AwsProviderPrerequisites = getProviderService()
