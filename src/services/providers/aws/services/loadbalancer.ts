import { pipe } from 'lodash/fp'
import { getBaseService } from '@src/services/utils'
import { PROVIDER, SERVICE_TYPE } from '@src/constants'
import {
  withRegions,
  type RegionalAttributes,
  withHandler,
  withAssociations,
} from '@src/services/behaviors'
import { REGIONS } from '@aws/constants'
import { getProviderAssociations } from '@aws/utils/getProviderAssociations'
import { getNetworkingAssociations } from '@aws/utils/getNetworkingAssociations'
import { alb, securityGroup } from '@cdktf/provider-aws'
import { TerraformOutput } from 'cdktf'
import type { Stack } from '@src/lib/stack'
import type { BaseServiceAttributes, Provisionable, Service } from '@src/services/types'
import type { AwsNetworkingAssociations, AwsProviderAssociations } from '@aws/types'

export type AwsLoadBalancerAttributes = BaseServiceAttributes &
  RegionalAttributes & {
    provider: typeof PROVIDER.AWS
    type: typeof SERVICE_TYPE.LOAD_BALANCER
  }

export type AwsLoadBalancerResources = {
  loadBalancer: alb.Alb
  securityGroup: securityGroup.SecurityGroup
  outputs: TerraformOutput[]
}

export type AwsLoadBalancerService = Service<
  AwsLoadBalancerAttributes,
  AwsProviderAssociations & AwsNetworkingAssociations
>

export type AwsLoadBalancerProvisionable = Provisionable<
  AwsLoadBalancerService,
  AwsLoadBalancerResources
>

export const resourceHandler = (
  provisionable: AwsLoadBalancerProvisionable,
  stack: Stack,
): AwsLoadBalancerResources => {
  const {
    config,
    resourceId,
    requirements: { vpc, providerInstance, publicSubnets },
  } = provisionable

  const sg = new securityGroup.SecurityGroup(stack.context, `${resourceId}_security_group`, {
    provider: providerInstance,
    vpcId: vpc.id,
    ingress: [
      {
        fromPort: 80,
        toPort: 80,
        protocol: 'tcp',
        cidrBlocks: ['0.0.0.0/0'],
        ipv6CidrBlocks: ['::/0'],
      },
      {
        fromPort: 443,
        toPort: 443,
        protocol: 'tcp',
        cidrBlocks: ['0.0.0.0/0'],
        ipv6CidrBlocks: ['::/0'],
      },
    ],
    egress: [
      {
        fromPort: 0,
        toPort: 0,
        protocol: '-1',
        cidrBlocks: ['0.0.0.0/0'],
        ipv6CidrBlocks: ['::/0'],
      },
    ],
  })

  const loadBalancer = new alb.Alb(stack.context, resourceId, {
    name: config.name,
    loadBalancerType: 'application',
    internal: false,
    enableHttp2: true,
    provider: providerInstance,
    subnets: publicSubnets.map((subnet) => subnet.id),
    securityGroups: [sg.id, vpc.defaultSecurityGroupId],
    lifecycle: {
      createBeforeDestroy: true,
    },
  })

  const outputs = [
    new TerraformOutput(stack.context, `${resourceId}_loadbalancer_url`, {
      description: 'The URL for the load balancer',
      value: loadBalancer.dnsName,
    }),
  ]

  return {
    loadBalancer,
    securityGroup: sg,
    outputs,
  }
}

const getLoadBalancerService = (): AwsLoadBalancerService =>
  pipe(
    withHandler(resourceHandler),
    withAssociations(getProviderAssociations()),
    withAssociations(getNetworkingAssociations()),
    withRegions(REGIONS),
  )(getBaseService(PROVIDER.AWS, SERVICE_TYPE.LOAD_BALANCER))

export const AwsLoadBalancer = getLoadBalancerService()
