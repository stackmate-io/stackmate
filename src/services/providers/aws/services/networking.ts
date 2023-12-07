import { ImportableResource, TerraformOutput } from 'cdktf'
import {
  internetGateway,
  subnet,
  vpc as awsVpc,
  routeTable,
  routeTableAssociation,
} from '@cdktf/provider-aws'
import { getCidrBlocks } from '@src/lib/networking'
import { getBaseService, getProfile } from '@src/services/utils'
import { DEFAULT_VPC_IP, REGIONS } from '@aws/constants'
import { PROVIDER, SERVICE_TYPE } from '@src/constants'
import { pipe } from 'lodash/fp'
import {
  profileable,
  withRegions,
  withHandler,
  withAssociations,
  withSchema,
} from '@src/services/behaviors'
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
  const {
    config,
    resourceId,
    requirements: { providerInstance },
  } = provisionable

  const { vpc: vpcConfig, subnet: subnetConfig, gateway: gatewayConfig } = getProfile(config)
  const [vpcCidr, ...subnetCidrs] = getCidrBlocks(config.rootIp || DEFAULT_VPC_IP, 16, 4, 24)

  const vpc = new awsVpc.Vpc(stack.context, resourceId, {
    ...vpcConfig,
    cidrBlock: vpcCidr,
  })

  if (config.vpcId) {
    const imp = new ImportableResource(stack.context, `${resourceId}_imported_default_vpc`, {
      importId: config.vpcId,
      provider: providerInstance,
      terraformResourceType: awsVpc.Vpc.tfResourceType,
    })

    vpc.importFrom(imp.friendlyUniqueId, providerInstance)
  }

  const availabilityZones = 'abcd'.split('').map((suffix) => `${config.region}${suffix}`)

  const createSubnets = (cidrs: string[], name: string, isPublic: boolean) =>
    cidrs.map(
      (cidrBlock, idx) =>
        new subnet.Subnet(stack.context, `${resourceId}_${name}${idx + 1}`, {
          ...subnetConfig,
          vpcId: vpc.id,
          cidrBlock,
          availabilityZone: availabilityZones[idx],
          mapPublicIpOnLaunch: isPublic,
        }),
    )

  const subnets = createSubnets(subnetCidrs.splice(2), 'subnet', false)
  const publicSubnets = createSubnets(subnetCidrs.splice(2), 'public_subnet', true)

  const gateway = new internetGateway.InternetGateway(stack.context, `${resourceId}_gateway`, {
    ...gatewayConfig,
    vpcId: vpc.id,
  })

  // Assign route table for public subnets
  const routes = new routeTable.RouteTable(stack.context, `${resourceId}_route_table`, {
    vpcId: vpc.id,
    route: [
      {
        cidrBlock: '0.0.0.0/0',
        gatewayId: gateway.id,
      },
    ],
  })

  publicSubnets.forEach(
    (subnet, idx) =>
      new routeTableAssociation.RouteTableAssociation(
        stack.context,
        `${resourceId}_association${idx}`,
        {
          subnetId: subnet.id,
          routeTableId: routes.id,
        },
      ),
  )

  const outputs: TerraformOutput[] = [
    new TerraformOutput(stack.context, `${resourceId}_vpc_id`, {
      description: 'VPC ID',
      value: vpc.id,
    }),
    new TerraformOutput(stack.context, `${resourceId}_vpc_cidr_block`, {
      description: 'VPC CIDR block',
      value: vpc.cidrBlock,
    }),
    ...subnets.map(
      (subnet, idx) =>
        new TerraformOutput(stack.context, `${resourceId}_subnet_output_${idx}`, {
          description: `Private Subnet CIDR #${idx}`,
          value: subnet.cidrBlock,
        }),
    ),
    ...publicSubnets.map(
      (subnet, idx) =>
        new TerraformOutput(stack.context, `${resourceId}_public_subnet_output_${idx}`, {
          description: `Public Subnet CIDR #${idx}`,
          value: subnet.cidrBlock,
        }),
    ),
  ]

  return {
    vpc,
    subnets,
    gateway,
    outputs,
    publicSubnets,
  }
}

const getNetworkingService = (): AwsNetworkingService =>
  pipe(
    profileable(),
    withRegions(REGIONS),
    withHandler(resourceHandler),
    withAssociations(getProviderAssociations()),
    withSchema({
      type: 'object',
      properties: {
        vpcId: {
          type: 'string',
        },
        rootIp: {
          type: 'string',
          default: DEFAULT_VPC_IP,
        },
      },
    }),
  )(getBaseService(PROVIDER.AWS, SERVICE_TYPE.NETWORKING))

export const AwsNetworking = getNetworkingService()
