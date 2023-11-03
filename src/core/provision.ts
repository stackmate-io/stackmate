import { Registry } from '@core/registry'
import { hashObject } from '@lib/hash'
import { getValidData } from '@core/validation'
import { getSchema } from '@core/schema'
import type { ServiceAttributes, ServiceConfiguration } from '@core/registry'
import type { AnyAssociationHandler, BaseProvisionable } from '@core/service'
import type { TerraformElement, TerraformLocal, TerraformOutput } from 'cdktf'

/**
 * @type {Resource} a resource provisioned by the system
 */
export type Resource = TerraformElement

/**
 * @type {ProvisionResources} types of resources that are provisioned by the handlers
 */
export type ProvisionResources = Resource | Resource[] | Record<string, Resource>

/**
 * @type {Provisions} the type returned by provision handlers
 */
export type Provisions = Record<string, ProvisionResources> & {
  /**
   * The service's IP address to allow linking with services with
   */
  ip?: TerraformLocal

  /**
   * The service's outputs
   */
  outputs?: TerraformOutput[]

  /**
   * A resource reference such as a resource's ID to link with services within the same provider
   */
  resourceRef?: TerraformLocal
}

export type ProvisionablesMap = Map<BaseProvisionable['id'], BaseProvisionable>

export type AssociatedProvisionable = {
  name: string
  target: BaseProvisionable
  handler: AnyAssociationHandler
}
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
    getSchema(),
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
