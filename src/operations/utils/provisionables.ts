import { isEqual, snakeCase } from 'lodash'
import { hashObject } from '@lib/hash'
import { Registry } from '@services/registry'
import type { ServiceConfiguration } from '@services/registry'
import type { BaseProvisionable, ProviderChoice, ServiceTypeChoice } from '@services/types'

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
  create<C extends ServiceConfiguration = ServiceConfiguration>(config: C) {
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
  find<C extends ServiceConfiguration = ServiceConfiguration>(
    config: Partial<C>,
  ): BaseProvisionable {
    for (const prov of this.values()) {
      if (isEqual(prov.config, config)) {
        return prov
      }
    }

    throw new Error('Provisionable was not found in the list')
  }

  /**
   * Gets a provisionable based on a service's attributes
   * @param {BaseServiceAttributes} config the service's configuration
   * @returns {BaseProvisionable} the provisionable to use in operations
   */
  protected getProvisionable<C extends ServiceConfiguration = ServiceConfiguration>(
    config: C,
  ): BaseProvisionable<C> {
    const { type, provider } = config

    return {
      id: hashObject(config),
      config,
      service: Registry.get(provider, type),
      requirements: {},
      provisions: {},
      sideEffects: {},
      registered: false,
      resourceId: this.getResourceId(provider, type),
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
  protected getResourceId(provider: ProviderChoice, type: ServiceTypeChoice): string {
    const serviceGroup = `${provider}-${type}`
    const index = (this.#serviceCounts.get(serviceGroup) || 0) + 1
    this.#serviceCounts.set(serviceGroup, index)

    return snakeCase(`${serviceGroup} ${index || ''}`.trim())
  }
}