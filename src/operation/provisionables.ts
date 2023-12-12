import { isEqual, snakeCase } from 'lodash'
import { hashObject } from '@lib/hash'
import { Registry } from '@services/registry'
import type {
  BaseProvisionable,
  BaseServiceAttributes,
  ProviderChoice,
  ServiceTypeChoice,
} from '@services/types'

export class ProvisionablesMap extends Map<string, BaseProvisionable> {
  /**
   * @var {Map} serviceCounts the counts per service type and provider
   */
  #serviceCounts: Map<string, number> = new Map()

  /**
   * Adds a provisionable to the map
   *
   * @param {BaseProvisionable} provisionable the provisionable to add in the map
   */
  add(provisionable: BaseProvisionable) {
    this.set(provisionable.id, provisionable)
  }

  /**
   * Creates a provisionable and adds it in the map
   *
   * @param {ServiceConfiguration} config the configuration of the item to add
   */
  create<C extends BaseServiceAttributes>(config: C): BaseProvisionable<C> {
    const provisionable = this.getProvisionable<C>(config)
    this.add(provisionable)
    return provisionable
  }

  /**
   * Finds an item by its config
   *
   * @param {BaseProvisionable} config the configuration to look the provisionable by
   * @returns {BaseProvisionable}
   * @throws {Error} if the provisionable is not found
   */
  find<C extends BaseServiceAttributes = BaseServiceAttributes>(
    config: Partial<C>,
  ): BaseProvisionable | null {
    for (const prov of this.values()) {
      if (isEqual(prov.config, config)) {
        return prov
      }
    }

    return null
  }

  /**
   * Gets a provisionable based on a service's attributes
   * @param {BaseServiceAttributes} config the service's configuration
   * @returns {BaseProvisionable} the provisionable to use in operations
   */
  protected getProvisionable<C extends BaseServiceAttributes>(config: C): BaseProvisionable<C> {
    const { type, provider, region } = config

    return {
      id: hashObject(config),
      config,
      service: Registry.get(provider, type),
      requirements: {},
      provisions: {},
      sideEffects: {},
      registered: false,
      resourceId: this.getResourceId(provider, type, region),
      variables: {},
    }
  }

  /**
   * Returns a resource's id based on its provider, type and unique count
   *
   * !!!!!!!
   * WARNING: Changing the resource ID will trigger new service deployment
   * !!!!!!!
   *
   * @param {ProviderChoice} provider the resource's provider
   * @param {ServiceTypeChoice} type the resource's type
   * @returns {String} the resource id
   */
  protected getResourceId(
    provider: ProviderChoice,
    type: ServiceTypeChoice,
    region?: string,
  ): string {
    const serviceGroup = `${provider}-${type}${region ? `-${region}` : ''}`
    const index = (this.#serviceCounts.get(serviceGroup) || 0) + 1
    this.#serviceCounts.set(serviceGroup, index)

    return snakeCase(`${serviceGroup} ${index || ''}`.trim())
  }
}
