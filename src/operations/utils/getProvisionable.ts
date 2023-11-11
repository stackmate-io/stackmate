import { snakeCase } from 'lodash'
import { hashObject } from '@lib/hash'
import { Registry, type ServiceAttributes } from '@services/registry'
import type { BaseProvisionable } from '@services/types'

/**
 * Gets a provisionable based on a service's attributes
 * @param {BaseServiceAttributes} config the service's configuration
 * @returns {BaseProvisionable} the provisionable to use in operations
 */
export const getProvisionable = <C extends ServiceAttributes = ServiceAttributes>(
  config: C,
): BaseProvisionable<C> => {
  const { name, type, provider, region } = config
  const resourceId = snakeCase(`${name || type}-${provider}-${region || 'default'}`)

  return {
    id: hashObject(config),
    config,
    service: Registry.get(provider, type),
    requirements: {},
    provisions: {},
    sideEffects: {},
    registered: false,
    resourceId: resourceId,
    variables: {},
  }
}
