import { DEFAULT_REGION } from '@src/services/providers/aws/constants'
import { PROVIDER, SERVICE_TYPE } from '@src/constants'
import { getProvisionable } from '@core/provision'
import { generateCredentials } from '@src/services/providers/aws/services/secrets'
import { resourceHandler as providerDeployHandler } from '@src/services/providers/aws/services/provider'
import type { Stack } from '@lib/stack'
import type { ServiceAttributes } from '@core/registry'
import type { BaseProvisionable } from 'src/services/types/provisionable'
import type { CredentialsHandlerOptions } from 'src/services/behaviors'
import type {
  AwsSecretsResources,
  AwsSecretsProvisionable,
} from '@src/services/providers/aws/services/secrets'
import type {
  AwsProviderProvisionable,
  AwsProviderResources,
} from '@src/services/providers/aws/types'

export const getProviderResources = (stack: Stack): AwsProviderResources => {
  const provisionable = getProvisionable({
    provider: PROVIDER.AWS,
    name: 'aws-provider-service',
    type: SERVICE_TYPE.PROVIDER,
    region: DEFAULT_REGION,
  })

  return providerDeployHandler(provisionable as AwsProviderProvisionable, stack)
}

export const getCredentialResources = (
  providerResources: AwsProviderResources,
  target: BaseProvisionable,
  stack: Stack,
  opts?: CredentialsHandlerOptions,
): AwsSecretsResources => {
  const provisionable = getProvisionable({
    provider: PROVIDER.AWS,
    name: 'aws-secrets-service',
    type: SERVICE_TYPE.SECRETS,
    region: DEFAULT_REGION,
  })

  Object.assign(provisionable, { requirements: providerResources })

  return generateCredentials(provisionable as AwsSecretsProvisionable, stack, target, opts)
}

export const getAwsProvisionableMock = <P extends BaseProvisionable>(
  config: ServiceAttributes,
  stack: Stack,
  { withCredentials = false, withRootCredentials = false } = {},
): P => {
  const provisionable = getProvisionable(config)
  const providerResources = getProviderResources(stack)

  Object.assign(provisionable, {
    requirements: {
      ...providerResources,
      ...(withCredentials
        ? { credentials: getCredentialResources(providerResources, provisionable, stack) }
        : {}),
      ...(withRootCredentials
        ? {
            rootCredentials: getCredentialResources(providerResources, provisionable, stack, {
              root: true,
            }),
          }
        : {}),
    },
  })

  return provisionable as P
}
