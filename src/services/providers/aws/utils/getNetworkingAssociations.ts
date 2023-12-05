import { SERVICE_TYPE } from '@src/constants'
import type { AwsNetworkingAssociations, AwsNetworkingProvisionable } from '@aws/types'
import type { internetGateway, subnet, vpc } from '@cdktf/provider-aws'
import type { BaseServiceAttributes } from '@services/types'

const getVpcRequirement = (): AwsNetworkingAssociations['vpc'] => ({
  with: SERVICE_TYPE.NETWORKING,
  requirement: true,
  where: (config: BaseServiceAttributes, linked: BaseServiceAttributes) =>
    config.provider === linked.provider && config.region === linked.region,
  handler: (prov: AwsNetworkingProvisionable): vpc.Vpc => prov.provisions.vpc,
})

const getSubnetsRequirement = (publicSubnets: boolean): AwsNetworkingAssociations['subnets'] => ({
  with: SERVICE_TYPE.NETWORKING,
  requirement: true,
  where: (config: BaseServiceAttributes, linked: BaseServiceAttributes) =>
    config.provider === linked.provider && config.region === linked.region,
  handler: (prov: AwsNetworkingProvisionable): subnet.Subnet[] =>
    publicSubnets ? prov.provisions.publicSubnets : prov.provisions.subnets,
})

const getGatewayRequirement = (): AwsNetworkingAssociations['gateway'] => ({
  with: SERVICE_TYPE.NETWORKING,
  requirement: true,
  where: (config: BaseServiceAttributes, linked: BaseServiceAttributes) =>
    config.provider === linked.provider && config.region === linked.region,
  handler: (prov: AwsNetworkingProvisionable): internetGateway.InternetGateway =>
    prov.provisions.gateway,
})

export const getNetworkingAssociations = (): AwsNetworkingAssociations => ({
  vpc: getVpcRequirement(),
  subnets: getSubnetsRequirement(false),
  gateway: getGatewayRequirement(),
  publicSubnets: getSubnetsRequirement(true),
})
