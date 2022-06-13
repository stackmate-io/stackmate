import { get } from 'lodash';

import * as AwsServices from '@stackmate/engine/providers/aws';
import * as LocalServices from '@stackmate/engine/providers/local';
import { PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';
import {
  ProviderChoice, BaseService, ServiceScopeChoice, ServiceTypeChoice,
  ServiceConstructor, ServiceRegistry as CloudServiceRegistry, TypeServiceMapping, RequireKeys,
} from '@stackmate/engine/types';

class ServicesRegistry implements CloudServiceRegistry {
  /**
   * @var {Object} items the items in the registry
   */
  readonly items: Map<ProviderChoice, TypeServiceMapping> = new Map();

  /**
   * Adds a service to the registry
   *
   * @param {ServiceConstructor} classConstructor the service class to add to the registry
   * @param {ProviderChoice} provider the provider that the service uses
   * @param {ServiceTypeChoice} type the service's type
   */
  add(
    classConstructor: ServiceConstructor,
    provider: ProviderChoice,
    type: ServiceTypeChoice,
  ): void {
    const providerServices = this.items.get(provider) || new Map();
    providerServices.set(type, classConstructor);
    this.items.set(provider, providerServices)
  }

  /**
   * Gets a service from the registry
   *
   * @param {ProviderChoice} provider the provider to get the service type for
   * @param {ServiceTypeChoice} type the type of the service to get
   * @returns {ServiceConstructor} the service constructor
   * @throws {Error} if the service is not registered
   */
  get(provider: ProviderChoice, type: ServiceTypeChoice): ServiceConstructor {
    const service = this.items.get(provider)?.get(type);

    if (!service) {
      throw new Error(`Provider ${provider} does not have service ${type} registered`);
    }

    return service;
  }

  /**
   * Returns whether a service exists for a certain provider
   *
   * @param {ProviderChoice} provider the provider to check whether the service exists
   * @param {ServiceTypeChoice} service the service to check whether exists
   * @returns {Boolean} whether the provider specified has the service requested
   */
  exists(provider: ProviderChoice, service: ServiceTypeChoice): boolean {
    return Boolean(get(this.items, `${provider}.${service}`, null));
  }

  /**
   * Returns the available service types for a provider
   *
   * @param {ProviderChoice} provider the provider to get the service types
   * @returns {ServiceTypeChoice[]} the service types available for the provider
   */
  types(provider: ProviderChoice): ServiceTypeChoice[] {
    return Object.keys(this.items.get(provider) || {}) as Array<ServiceTypeChoice>;
  }

  /**
   * Returns the list of available providers
   *
   * @returns {ProviderChoice[]} the list of providers available
   */
  providers(type: ServiceTypeChoice): ProviderChoice[] {
    return (Object.keys(this.items) as Array<ProviderChoice>).filter(
      (provider: ProviderChoice) => (
        get(this.items, `${provider}.${type}`, null) !== null
      ),
    );
  }
}

const registry = new ServicesRegistry();

// Add the local services to the registry
registry.add(LocalServices.Provider, PROVIDER.LOCAL, SERVICE_TYPE.STATE);
registry.add(LocalServices.State, PROVIDER.LOCAL, SERVICE_TYPE.STATE);

// Add the AWS services to the registry
registry.add(AwsServices.Provider, PROVIDER.AWS, SERVICE_TYPE.PROVIDER);
registry.add(AwsServices.MariaDB, PROVIDER.AWS, SERVICE_TYPE.MARIADB);
registry.add(AwsServices.MySQL, PROVIDER.AWS, SERVICE_TYPE.MYSQL);
registry.add(AwsServices.PostgreSQL, PROVIDER.AWS, SERVICE_TYPE.POSTGRESQL);
registry.add(AwsServices.Vault, PROVIDER.AWS, SERVICE_TYPE.VAULT);
registry.add(AwsServices.State, PROVIDER.AWS, SERVICE_TYPE.STATE);

/**
 * Returns a service instance based on its attributes
 *
 * @param {BaseService.Attributes} attrs the attributes to instantiate the service by
 * @param {ServiceScopeChoice} scope the scope to apply to the service
 * @returns {CloudService} the service instantiated and with the scope applied
 */
export const getService = <T extends BaseService.Attributes>(
  attrs: RequireKeys<T, 'provider' | 'type'>, scope: ServiceScopeChoice = 'deployable',
) => {
  const { provider, type } = attrs;
  return registry.get(provider, type).factory(attrs).scope(scope);
};

export default registry as ServicesRegistry;
