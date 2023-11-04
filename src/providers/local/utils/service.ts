import pipe from 'lodash/fp/pipe'
import { PROVIDER, SERVICE_TYPE } from '@constants'
import { getBaseService } from '@services/utils'
import { withAssociations } from '@services/behaviors'
import type { provider as terraformLocalProvider } from '@cdktf/provider-local'
import type { LocalProviderProvisionable } from '@providers/local/services/provider'
import type { BaseServiceAttributes, ServiceTypeChoice } from '@services/types'
import type { LocalProviderAttributes, LocalServiceAssociations } from './types'

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
  pipe(withAssociations(associations))(getBaseService(PROVIDER.LOCAL, type))
