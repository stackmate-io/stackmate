import pipe from 'lodash/fp/pipe'
import { PROVIDER, SERVICE_TYPE } from '@constants'
import { associate, getBaseService } from '@core/service'
import type { provider as terraformLocalProvider } from '@cdktf/provider-local'

import type {
  LocalProviderAttributes,
  LocalProviderProvisionable,
} from '@providers/local/services/provider'
import type {
  BaseServiceAttributes,
  Service,
  ServiceAssociations,
  ServiceRequirement,
  ServiceTypeChoice,
} from '@core/service'
import type { Obj } from '@lib/util'

type ProviderRequirement = ServiceRequirement<
  terraformLocalProvider.LocalProvider,
  typeof SERVICE_TYPE.PROVIDER
>

export type LocalServiceAssociations = {
  providerInstance: ProviderRequirement
}

export type LocalServiceAttributes<Attrs extends BaseServiceAttributes> = Attrs & {
  provider: typeof PROVIDER.LOCAL
}

export type LocalService<
  Attrs extends BaseServiceAttributes,
  Assocs extends ServiceAssociations = Obj,
> = Service<LocalServiceAttributes<Attrs>, LocalServiceAssociations & Assocs>

/**
 * @var {LocalServiceAssociations} associations Service Associations applied to all local services
 */
const associations: LocalServiceAssociations = {
  providerInstance: {
    with: SERVICE_TYPE.PROVIDER,
    requirement: true,
    where: (config: LocalProviderAttributes, linked: BaseServiceAttributes) =>
      config.provider === linked.provider,
    handler: (p: LocalProviderProvisionable): terraformLocalProvider.LocalProvider => {
      return p.provisions.provider
    },
  },
}

export const getLocalService = (type: ServiceTypeChoice) =>
  pipe(associate(associations))(getBaseService(PROVIDER.LOCAL, type))
