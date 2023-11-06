import { snakeCase, uniq } from 'lodash'
import * as Services from '@services/providers/services'
import { hashObject } from '@lib/hash'
import type { Distribute, DistributiveRequireKeys } from '@lib/util'
import type {
  ProviderChoice,
  ServiceTypeChoice,
  ExtractAttrs,
  BaseProvisionable,
} from '@services/types'

const availableServices = Object.values(Services)

// In order for hints to work properly when we type project configurations (eg. in tests),
// the union types extracted from AvailableServices should be distributive
// https://www.typescriptlang.org/docs/handbook/2/conditional-types.html#distributive-conditional-types
type AvailableServices = Distribute<typeof availableServices>
type AvailableService = Distribute<AvailableServices[number]>

export type ServiceAttributes = Distribute<ExtractAttrs<AvailableService>>
export type ServiceConfiguration = DistributiveRequireKeys<
  ServiceAttributes,
  'name' | 'type' | 'provider'
>

class Registry {
  /**
   * @var {BaseServices[]} items the service items in the registry
   * @readonly
   */
  readonly #items: AvailableService[] = []

  /**
   * @var {Map<ProviderChoice, readonly string[]>} regions the regions available per provider
   * @readonly
   */
  readonly #regions: Map<ProviderChoice, Set<string>> = new Map()

  /**
   * @constructor
   */
  constructor() {
    this.#items.push(...availableServices)

    // Extract the regions from each service and group them by provider
    this.#items.forEach(({ provider, regions = [] }) => {
      const updated = Array.from(this.#regions.get(provider) || []).concat(regions || [])
      this.#regions.set(provider, new Set(updated))
    })
  }

  /**
   * Returns all services available in the registry
   *
   * @returns {AvailableServices}
   */
  all(): AvailableServices {
    return this.#items
  }

  /**
   * Finds and returns a service in the registry by provider and service type
   *
   * @param {ProviderChoice} provider the provide to find the service by
   * @param {ServiceTypeChoice} type the type to find the service by
   * @returns {AvailableService} the service returned
   * @throws {Error} if the service is not found
   */
  get(provider: ProviderChoice, type: ServiceTypeChoice): AvailableService {
    const service = this.#items.find((s) => s.provider === provider && s.type === type)

    if (!service) {
      throw new Error(`Service ${type} for provider ${provider} was not found`)
    }

    return service
  }

  /**
   * Returns services of a specific service type
   *
   * @param {ServiceTypeChoice} type the type to look services up by
   * @returns {BaseService[]} ths services returned
   */
  ofType(type: ServiceTypeChoice): AvailableService[] {
    return this.#items.filter((s) => s.type === type)
  }

  /**
   * Returns services of a specific service provider
   *
   * @param {ProviderChoice} provider the provider to look services up by
   * @returns {BaseService[]} ths services returned
   */
  ofProvider(provider: ProviderChoice): AvailableService[] {
    return this.#items.filter((s) => s.provider === provider)
  }

  /**
   * Finds and returns a service in the registry given its configuration
   *
   * @param {BaseServiceAttributes} config the service configuration
   * @returns {BaseService} the service matching the configuration
   * @throws {Error} if the service is not found
   */
  fromConfig(config: ServiceConfiguration): AvailableService {
    const { provider, type } = config
    return this.get(provider, type)
  }

  /**
   * Returns the providers for a specific services (if provided), or all available otherwise
   *
   * @returns {ProviderChoice[]} the providers available for the service (if any, otherwise all)
   */
  providers(serviceType?: ServiceTypeChoice): ProviderChoice[] {
    if (!serviceType) {
      return uniq(this.#items.map((s) => s.provider))
    }

    return uniq(this.#items.filter((s) => s.type === serviceType).map((s) => s.provider))
  }

  /**
   * Returns the regions a provider is available in
   *
   * @param {ProviderChoice} provider the provider to get the regions for
   * @returns {string[]}
   */
  regions(provider: ProviderChoice): string[] {
    const regions = this.#regions.get(provider) || new Set()
    return Array.from(regions)
  }

  /**
   * Returns the types of services for a specific provider (if provided), or all available otherwise
   *
   * @returns {ServiceTypeChoice[]} the service types available for the provider (if any, otherwise all)
   */
  types(provider?: ProviderChoice): ServiceTypeChoice[] {
    if (!provider) {
      return uniq(this.#items.map((s) => s.type))
    }

    return uniq(this.#items.filter((s) => s.provider === provider).map((s) => s.type))
  }

  /**
   * Gets a provisionable based on a service's attributes
   * @param {BaseServiceAttributes} config the service's configuration
   * @returns {BaseProvisionable} the provisionable to use in operations
   */
  provisionable<C extends ServiceAttributes = ServiceAttributes>(config: C): BaseProvisionable<C> {
    const { name, type, provider, region } = config
    const resourceId = snakeCase(`${name || type}-${provider}-${region || 'default'}`)

    return {
      id: hashObject(config),
      config,
      service: this.fromConfig(config),
      requirements: {},
      provisions: {},
      sideEffects: {},
      registered: false,
      resourceId: resourceId,
    }
  }
}

const registry = new Registry()
export { registry as Registry }
