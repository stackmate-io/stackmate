import { SERVICE_TYPE } from '@src/constants'
import type { provider as terraformLocalProvider } from '@cdktf/provider-local'
import type {
  LocalProviderAttributes,
  LocalProviderProvisionable,
  LocalProviderAssociations,
} from '@local/types'
import type { BaseServiceAttributes } from '@services/types'

export const getLocalProviderAssociations = (): LocalProviderAssociations => ({
  providerInstance: {
    with: SERVICE_TYPE.PROVIDER,
    requirement: true,
    where: (config: LocalProviderAttributes, linked: BaseServiceAttributes) =>
      config.provider === linked.provider,
    handler: (p: LocalProviderProvisionable): terraformLocalProvider.LocalProvider => {
      return p.provisions.provider
    },
  },
})
