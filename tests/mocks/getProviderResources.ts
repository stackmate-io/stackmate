import { PROVIDER, SERVICE_TYPE } from '@src/constants'
import { Registry } from '@services/registry'
import { resourceHandler as providerDeployHandler } from '@aws/services/provider'
import type { Stack } from '@lib/stack'
import type {
  AwsProviderProvisionable,
  AwsProviderResources,
} from '@src/services/providers/aws/types'

export const getProviderResources = (stack: Stack): AwsProviderResources => {
  const provisionable = Registry.provisionable({
    provider: PROVIDER.AWS,
    name: 'aws-provider-service',
    type: SERVICE_TYPE.PROVIDER,
    region: 'eu-central-1',
  })

  return providerDeployHandler(provisionable as AwsProviderProvisionable, stack)
}
