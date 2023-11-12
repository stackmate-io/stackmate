import { PROVIDER, SERVICE_TYPE } from '@src/constants'
import { resourceHandler as providerDeployHandler } from '@aws/services/provider'
import { resourceHandler as networkingDeployHandler } from '@aws/services/networking'
import { ProvisionablesMap } from '@src/operations/utils/provisionables'
import type { Stack } from '@lib/stack'
import type {
  AwsNetworkingProvisionable,
  AwsNetworkingResources,
  AwsProviderProvisionable,
  AwsProviderResources,
} from '@src/services/providers/aws/types'

export const getAwsServicePrerequisites = (
  stack: Stack,
): AwsProviderResources & AwsNetworkingResources => {
  const mapping = new ProvisionablesMap()

  const providerProvisionable = mapping.create({
    provider: PROVIDER.AWS,
    name: 'aws-provider-service',
    type: SERVICE_TYPE.PROVIDER,
    region: 'eu-central-1',
  })

  const providerResources = providerDeployHandler(
    providerProvisionable as AwsProviderProvisionable,
    stack,
  )

  const networkingProvisionable = mapping.create({
    provider: PROVIDER.AWS,
    name: 'aws-networking-service',
    type: SERVICE_TYPE.NETWORKING,
    region: 'eu-central-1',
  })

  Object.assign(networkingProvisionable, {
    requirements: { ...providerResources },
  })

  const networkingResources = networkingDeployHandler(
    networkingProvisionable as AwsNetworkingProvisionable,
    stack,
  )

  return {
    ...providerResources,
    ...networkingResources,
  }
}
