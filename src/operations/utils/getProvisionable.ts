import { snakeCase } from 'lodash'
import { hashObject } from '@lib/hash'
import { Registry, type ServiceAttributes } from '@services/registry'
import type { BaseProvisionable, Scope } from '@services/types'

/**
 * Gets a provisionable based on a service's attributes
 * @param {BaseServiceAttributes} config the service's configuration
 * @returns {BaseProvisionable} the provisionable to use in operations
 */
export const getProvisionable = <C extends ServiceAttributes = ServiceAttributes>(
  config: C,
  scope: Scope,
): BaseProvisionable<C> => {
  const { name, type, provider, region } = config
  const resourceId = snakeCase(`${name || type}-${provider}-${region || 'default'}`)
  const unscopedService = Registry.fromConfig(config)
  const service =
    scope === 'prerequisites' ? unscopedService.preparable() : unscopedService.deployable()

  return {
    id: hashObject(config),
    config,
    service,
    requirements: {},
    provisions: {},
    sideEffects: {},
    registered: false,
    resourceId: resourceId,
    variables: {},
  }
}
