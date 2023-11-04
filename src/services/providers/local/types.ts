import type { Obj } from '@lib/util'
import type { PROVIDER, SERVICE_TYPE } from '@src/constants'
import type { provider as terraformLocalProvider } from '@cdktf/provider-local'
import type {
  Service,
  ServiceAssociations,
  ServiceRequirement,
  BaseServiceAttributes,
  Provisionable,
} from '@services/types'

export type LocalProviderRequirement = ServiceRequirement<
  terraformLocalProvider.LocalProvider,
  typeof SERVICE_TYPE.PROVIDER
>

export type LocalServiceAssociations = {
  providerInstance: LocalProviderRequirement
}

export type LocalServiceAttributes<Attrs extends BaseServiceAttributes> = Attrs & {
  provider: typeof PROVIDER.LOCAL
}

export type LocalService<
  Attrs extends BaseServiceAttributes,
  Assocs extends ServiceAssociations = Obj,
> = Service<LocalServiceAttributes<Attrs>, LocalServiceAssociations & Assocs>

export type LocalProviderAttributes = LocalServiceAttributes<
  BaseServiceAttributes & {
    type: typeof SERVICE_TYPE.PROVIDER
  }
>

type LocalProviderInstanceResources = {
  provider: terraformLocalProvider.LocalProvider
}

export type LocalProviderResources = LocalProviderInstanceResources
export type LocalProviderService = Service<LocalProviderAttributes>
export type LocalProviderProvisionable = Provisionable<LocalProviderService, LocalProviderResources>
