import pipe from 'lodash/fp/pipe'
import { provider as terraformLocalProvider } from '@cdktf/provider-local'
import { PROVIDER, SERVICE_TYPE } from '@constants'
import { getBaseService, withHandler } from '@core/service'
import type { Stack } from '@lib/stack'
import type { Provisionable } from '@core/provision'
import type { LocalServiceAttributes } from '@providers/local/service'
import type { BaseServiceAttributes } from '@services/types'
import type { Service } from '@core/service'

export type ProviderInstanceResources = {
  provider: terraformLocalProvider.LocalProvider
}

export type LocalProviderAttributes = LocalServiceAttributes<
  BaseServiceAttributes & {
    type: typeof SERVICE_TYPE.PROVIDER
  }
>

export type LocalProviderResources = ProviderInstanceResources
export type LocalProviderService = Service<LocalProviderAttributes>
export type LocalProviderProvisionable = Provisionable<LocalProviderService, LocalProviderResources>

export const resourceHandler = (
  provisionable: LocalProviderProvisionable,
  stack: Stack,
): LocalProviderResources => {
  const provider = new terraformLocalProvider.LocalProvider(
    stack.context,
    provisionable.resourceId,
    { alias: `local-provider` },
  )

  return { provider }
}

/**
 * @returns {AwsProviderService} the secrets vault service
 */
export const getProviderService = (): LocalProviderService =>
  pipe(withHandler(resourceHandler))(getBaseService(PROVIDER.LOCAL, SERVICE_TYPE.PROVIDER))

export const LocalProvider = getProviderService()
