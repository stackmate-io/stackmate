import { type ServiceAttributes } from '@services/registry'
import type { Stack } from '@lib/stack'
import type { BaseProvisionable } from 'src/services/types/provisionable'
import { getProviderResources } from './getProviderResources'
import { getCredentialResources } from './getCredentialResources'
import { getProvisionable } from './getProvisionable'

export const getAwsProvisionable = <P extends BaseProvisionable>(
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
