import { Registry } from '@core/registry'
import { hashObject } from '@lib/hash'
import { getValidData } from '@core/validation'
import { getProjectSchema } from '@core/schema'
import type { ServiceAttributes, ServiceConfiguration } from '@core/registry'
import type { AnyAssociationHandler, BaseProvisionable } from '@core/service'

export type AssociatedProvisionable = {
  name: string
  target: BaseProvisionable
  handler: AnyAssociationHandler
}

export type ProvisionablesMap = Map<BaseProvisionable['id'], BaseProvisionable>
export type AssociatedProvisionablesMap = Map<BaseProvisionable['id'], AssociatedProvisionable[]>

/**
 * Gets a provisionable based on a service's attributes
 *
 * @param {BaseServiceAttributes} config the service's configuration
 * @returns {BaseProvisionable} the provisionable to use in operations
 */
export const getProvisionable = (config: ServiceAttributes): BaseProvisionable => {
  const { name, type, provider, region } = config
  const resourceId = `${name || type}-${provider}-${region || 'default'}`

  return {
    id: hashObject(config),
    config,
    service: Registry.fromConfig(config),
    requirements: {},
    provisions: {},
    sideEffects: {},
    registered: false,
    resourceId: resourceId,
  }
}

/**
 * Maps a list of service configurations to provisionables
 *
 * @param {ServiceConfiguration[]} configs the services configurations
 * @returns {ProvisionablesMap}
 */
export const getProvisionables = (configs: ServiceConfiguration[]): ProvisionablesMap => {
  const provisionables: ProvisionablesMap = new Map()

  // Get services validated and apply default values
  const serviceAttributes = getValidData<ServiceConfiguration[], ServiceAttributes[]>(
    configs,
    getProjectSchema(),
  )

  serviceAttributes.forEach((config) => {
    const provisionable = getProvisionable(config)
    provisionables.set(provisionable.id, provisionable)
  })

  return provisionables
}

/**
 * @param {BaseProvisionable} provisionable the provisionable to check
 * @throws {Error} if a requirement is not satisfied
 */
export const assertRequirementsSatisfied = (provisionable: BaseProvisionable) => {
  const {
    service: { associations = {}, type },
    requirements,
  } = provisionable

  Object.entries(associations).forEach(([name, assoc]) => {
    if (assoc.requirement && !requirements[name]) {
      throw new Error(`Requirement ${name} for service ${type} is not satisfied`)
    }
  })
}
