import { Registry } from '@core/registry'
import { hashObject } from '@lib/hash'
import { getValidData, getSchema } from '@core/validation'
import type { ServiceAttributes, ServiceConfiguration } from '@core/registry'
import type { Obj } from '@lib/util'
import type { BaseServiceAttributes } from 'src/services/types'
import type {
  AnyAssociationHandler,
  Association,
  BaseService,
  ExtractAttrs,
  ServiceAssociations,
} from 'src/services/behaviors'
import type { Provisions } from './types/resources'
import type { BaseProvisionable, ProvisionablesMap } from './types/provisionable'

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

export type AssociatedProvisionable = {
  name: string
  target: BaseProvisionable
  handler: AnyAssociationHandler
}
export type AssociatedProvisionablesMap = Map<BaseProvisionable['id'], AssociatedProvisionable[]>

/**
 * Gets a provisionable based on a service's attributes
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
