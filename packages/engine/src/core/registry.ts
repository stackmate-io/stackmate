import { uniq } from 'lodash';

import { BaseService, BaseServiceAttributes } from '@stackmate/engine/core/service';
import { ProviderChoice, ServiceTypeChoice } from '@stackmate/engine/core/service';
import * as AwsServices from '@stackmate/engine/providers/aws';

export type ServicesRegistry = {
  readonly items: BaseService[];
  readonly regions: Map<ProviderChoice, Set<string>>;
  providers(): ProviderChoice[];
  get(provider: ProviderChoice, type: ServiceTypeChoice): BaseService;
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
    services.forEach(({ provider, regions }) => {
      const updated = Array.from(this.regions.get(provider) || []).concat(regions || []);
      this.regions.set(provider, new Set(updated));
    });
  }

  /**
   * @returns {ProviderChoice[]} the providers whose services are available in the registry
   */
  providers(): ProviderChoice[] {
    return uniq(this.items.map(s => s.provider));
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

export default new Registry(
  ...Object.values(AwsServices),
) as Registry;
