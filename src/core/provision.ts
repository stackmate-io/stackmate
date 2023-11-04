import { Services } from '@core/registry'
import { hashObject } from '@lib/hash'
import { getValidData, getSchema } from '@core/validation'
import type { TerraformElement, TerraformLocal, TerraformOutput } from 'cdktf'
import type { ServiceAttributes, ServiceConfiguration } from '@core/registry'
import type { Obj } from '@lib/util'
import type { Stack } from '@core/stack'
import type {
  AnyAssociationHandler,
  Association,
  BaseService,
  BaseServiceAttributes,
  ExtractAttrs,
  ServiceAssociations,
} from '@core/service'

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

/**
 * @type {ExtractServiceRequirements} extracts service requirements from its associations
 */
type ExtractServiceRequirements<Associations extends ServiceAssociations> = {
  [K in keyof Associations]: Associations[K] extends infer A extends Association<any>
    ? A['requirement'] extends true
      ? ReturnType<A['handler']>
      : never
    : never
}

/**
 * @type {BaseProvisionable} base provisionable
 */
export type BaseProvisionable<Attrs extends BaseServiceAttributes = BaseServiceAttributes> = {
  id: string
  service: BaseService
  config: Attrs
  provisions: Provisions
  resourceId: string
  registered: boolean
  sideEffects: Provisions
  requirements: Record<string, ProvisionResources>
}

/**
 * @type {Provisionable} represents a piece of configuration and service to be deployed
 */
export type Provisionable<
  Srv extends BaseService,
  Provs extends Provisions,
  Context extends Obj = Obj,
  Attrs extends BaseServiceAttributes = ExtractAttrs<Srv>,
> = BaseProvisionable<Attrs> & {
  service: Srv
  config: Attrs
  provisions: Provs
  context: Context
  requirements: ExtractServiceRequirements<Srv['associations']>
}

/**
 * @type {ProvisionHandler} a function that can be used to deploy, prepare or destroy a service
 */
export type ProvisionHandler = (
  provisionable: BaseProvisionable,
  stack: Stack,
  opts?: object,
) => Provisions

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
    service: Services.fromConfig(config),
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
