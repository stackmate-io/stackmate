import { uniq } from 'lodash';

import * as Services from '@stackmate/engine/providers/services';
import { SERVICE_TYPE } from '@stackmate/engine/constants';
import { Distribute } from '@stackmate/engine/lib';
import {
  ProviderChoice, ServiceTypeChoice, BaseService, BaseServiceAttributes, ExtractAttrs,
} from '@stackmate/engine/core/service';

export type ServicesRegistry = {
  readonly items: BaseService[];
  readonly regions: Map<ProviderChoice, Set<string>>;
  get(provider: ProviderChoice, type: ServiceTypeChoice): BaseService;
  serviceTypes(provider?: ProviderChoice): ServiceTypeChoice[];
  providers(serviceType?: ServiceTypeChoice): ProviderChoice[];
  ofType(type: ServiceTypeChoice): BaseService[];
  ofProvider(provider: ProviderChoice): BaseService[];
  fromConfig(config: BaseServiceAttributes): BaseService;
};

class Registry implements ServicesRegistry {
  /**
   * @var {BaseServices[]} items the service items in the registry
   * @readonly
   */
  readonly items: BaseService[] = [];

  /**
   * @var {Map<ProviderChoice, readonly string[]>} regions the regions available per provider
   * @readonly
   */
  readonly regions: Map<ProviderChoice, Set<string>> = new Map();

  /**
   * @param {BaseService[]} services any services to initialize the registry with
   * @constructor
   */
  constructor(...services: BaseService[]) {
    this.items.push(...services);

    // Extract the regions from each service and group them by provider
    services.forEach(({ provider, regions = [] }) => {
      const updated = Array.from(this.regions.get(provider) || []).concat(regions || []);
      this.regions.set(provider, new Set(updated));
    });
  }

  /**
   * Returns the providers for a specific services (if provided), or all available otherwise
   *
   * @returns {ProviderChoice[]} the providers available for the service (if any, otherwise all)
   */
  providers(serviceType?: ServiceTypeChoice): ProviderChoice[] {
    if (!serviceType) {
      return uniq(this.items.map(s => s.provider));
    }

    return uniq(this.items.filter(s => s.type === serviceType).map(s => s.provider));
  }

  /**
   * Returns the types of services for a specific provider (if provided), or all available otherwise
   *
   * @returns {ServiceTypeChoice[]} the service types available for the provider (if any, otherwise all)
   */
  serviceTypes(provider?: ProviderChoice): ServiceTypeChoice[] {
    if (!provider) {
      return uniq(this.items.map(s => s.type));
    }

    return uniq(this.items.filter(s => s.provider === provider).map(s => s.type));
  }

  /**
   * Returns services of a specific service type
   *
   * @param {ServiceTypeChoice} type the type to look services up by
   * @returns {BaseService[]} ths services returned
   */
  ofType(type: ServiceTypeChoice): BaseService[] {
    return this.items.filter(s => s.type === type);
  }

  /**
   * Returns services of a specific service provider
   *
   * @param {ProviderChoice} provider the provider to look services up by
   * @returns {BaseService[]} ths services returned
   */
  ofProvider(provider: ProviderChoice): BaseService[] {
    return this.items.filter(s => s.provider === provider);
  }

  /**
   * Finds and returns a service in the registry by provider and service type
   *
   * @param {ProviderChoice} provider the provide to find the service by
   * @param {ServiceTypeChoice} type the type to find the service by
   * @returns {BaseService} the service returned
   * @throws {Error} if the service is not found
   */
  get(provider: ProviderChoice, type: ServiceTypeChoice): BaseService {
    const service = this.items.find(s => s.provider === provider && s.type === type);

    if (!service) {
      throw new Error(`Service ${type} for provider ${provider} was not found`);
    }

    return service;
  }

  /**
   * Finds and returns a service in the registry given its configuration
   *
   * @param {BaseServiceAttributes} config the service configuration
   * @returns {BaseService} the service matching the configuration
   * @throws {Error} if the service is not found
   */
  fromConfig(config: BaseServiceAttributes): BaseService {
    const { provider, type } = config;
    return this.get(provider, type);
  }
}

const registry = new Registry(...Object.values(Services)) as Registry;
const availableServices = Object.values(Services);

export type AvailableServices = typeof availableServices[number];

// In order for hints to work properly when we type project configurations (eg. in tests),
// the union types extracted from AvailableServices should be distributive
// https://www.typescriptlang.org/docs/handbook/2/conditional-types.html#distributive-conditional-types
export type AvailableServiceAttributes = Distribute<ExtractAttrs<AvailableServices>>;
export type ProviderServiceAttributes = Distribute<
  Extract<AvailableServiceAttributes, { type: typeof SERVICE_TYPE.PROVIDER; }>
>;
export type StateServiceAttributes = Distribute<
  Extract<AvailableServiceAttributes, { type: typeof SERVICE_TYPE.STATE; }>
>;
export type SecretVaultServiceAttributes = Distribute<
  Extract<AvailableServiceAttributes, { type: typeof SERVICE_TYPE.SECRETS }>
>;
export type CoreServiceAttributes = Distribute<
  StateServiceAttributes | SecretVaultServiceAttributes | ProviderServiceAttributes
>;
export type CloudServiceAttributes = Distribute<
  Exclude<AvailableServiceAttributes, CoreServiceAttributes>
>;
export { registry as Registry };
