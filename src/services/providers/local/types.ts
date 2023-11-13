import type { PROVIDER, SERVICE_TYPE } from '@src/constants'
import type { provider as terraformLocalProvider } from '@cdktf/provider-local'
import type {
  Service,
  ServiceRequirement,
  BaseServiceAttributes,
  Provisionable,
} from '@services/types'

export type LocalProviderRequirement = ServiceRequirement<
  terraformLocalProvider.LocalProvider,
  typeof SERVICE_TYPE.PROVIDER
>

export type LocalProviderAssociations = {
  providerInstance: LocalProviderRequirement
}

export type LocalProviderAttributes = BaseServiceAttributes & {
  provider: typeof PROVIDER.LOCAL
  type: typeof SERVICE_TYPE.PROVIDER
}

type LocalProviderInstanceResources = {
  provider: terraformLocalProvider.LocalProvider
}

export type LocalProviderResources = LocalProviderInstanceResources
export type LocalProviderService = Service<LocalProviderAttributes>
export type LocalProviderProvisionable = Provisionable<LocalProviderService, LocalProviderResources>
