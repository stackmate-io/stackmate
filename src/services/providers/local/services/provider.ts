import pipe from 'lodash/fp/pipe'
import { provider as terraformLocalProvider } from '@cdktf/provider-local'
import { PROVIDER, SERVICE_TYPE } from '@src/constants'
import { withHandler } from '@services/behaviors'
import { getBaseService } from '@services/utils'
import type { Stack } from '@lib/stack'
import type {
  LocalProviderProvisionable,
  LocalProviderResources,
  LocalProviderService,
} from '@local/types'

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
