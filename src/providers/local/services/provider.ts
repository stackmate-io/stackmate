import pipe from 'lodash/fp/pipe'
import { provider as terraformLocalProvider } from '@cdktf/provider-local'
import { PROVIDER, SERVICE_TYPE } from '@constants'
import { getBaseService, withHandler } from 'src/services/behaviors'
import type { Stack } from '@lib/stack'

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
