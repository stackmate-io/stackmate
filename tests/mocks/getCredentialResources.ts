import { PROVIDER, SERVICE_TYPE } from '@src/constants'
import { Registry } from '@services/registry'
import { generateCredentials } from '@aws/services/secrets'
import type { Stack } from '@lib/stack'
import type { BaseProvisionable } from 'src/services/types/provisionable'
import type { CredentialsHandlerOptions } from 'src/services/behaviors'
import type {
  AwsSecretsResources,
  AwsSecretsProvisionable,
} from '@src/services/providers/aws/services/secrets'
import type { AwsProviderResources } from '@src/services/providers/aws/types'

export const getCredentialResources = (
  providerResources: AwsProviderResources,
  target: BaseProvisionable,
  stack: Stack,
  opts?: CredentialsHandlerOptions,
): AwsSecretsResources => {
  const provisionable = Registry.provisionable({
    provider: PROVIDER.AWS,
    name: 'aws-secrets-service',
    type: SERVICE_TYPE.SECRETS,
    region: 'eu-central-1',
  })

  Object.assign(provisionable, { requirements: providerResources })

  return generateCredentials(provisionable as AwsSecretsProvisionable, stack, target, opts)
}
