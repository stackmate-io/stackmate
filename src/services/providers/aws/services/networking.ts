import { TerraformOutput } from 'cdktf'
import { internetGateway, subnet, vpc as awsVpc } from '@cdktf/provider-aws'
import { getCidrBlocks } from '@src/lib/networking'
import { getBaseService, getProfile } from '@src/services/utils'
import { DEFAULT_VPC_IP, REGIONS } from '@aws/constants'
import { PROVIDER, SERVICE_TYPE } from '@src/constants'
import { pipe } from 'lodash/fp'
import { profileable, withRegions, withHandler, withAssociations } from '@src/services/behaviors'
import { getProviderAssociations } from '@aws/utils/getProviderAssociations'
import type { Stack } from '@src/lib/stack'
import type {
  AwsNetworkingProvisionable,
  AwsNetworkingResources,
  AwsNetworkingService,
} from '@aws/types'

export const resourceHandler = (
  provisionable: AwsNetworkingProvisionable,
  stack: Stack,
): AwsNetworkingResources => {
  const { config, resourceId } = provisionable
  const { vpc: vpcConfig, subnet: subnetConfig, gateway: gatewayConfig } = getProfile(config)
  const [vpcCidr, ...subnetCidrs] = getCidrBlocks(config.rootIp || DEFAULT_VPC_IP, 16, 2, 24)

  const vpc = new awsVpc.Vpc(stack.context, resourceId, {
    ...vpcConfig,
    cidrBlock: vpcCidr,
  })

  if (subnetCidrs.length > 3) {
    throw new Error('It is advised to use up to 3 subnets')
  }

  const availabilityZones = 'abcd'.split('').map((suffix) => `${config.region}${suffix}`)
  const subnets = subnetCidrs.map(
    (cidrBlock, idx) =>
      new subnet.Subnet(stack.context, `${resourceId}_subnet${idx + 1}`, {
        ...subnetConfig,
        vpcId: vpc.id,
        cidrBlock,
        availabilityZone: availabilityZones[idx],
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
    vpc,
    subnets,
    gateway,
    outputs,
  }
}

const getNetworkingService = (): AwsNetworkingService =>
  pipe(
    profileable(),
    withRegions(REGIONS),
    withHandler(resourceHandler),
    withAssociations(getProviderAssociations()),
  )(getBaseService(PROVIDER.AWS, SERVICE_TYPE.NETWORKING))

export const AwsNetworking = getNetworkingService()
