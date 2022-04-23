import * as AwsServices from '@stackmate/engine/providers/aws';
import * as LocalServices from '@stackmate/engine/providers/local';
import { PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';
import {
  ProviderChoice, ServiceAttributes, ServiceScopeChoice,
  CloudServiceRegistry, CloudServiceConstructor, ServiceTypeChoice,
} from '@stackmate/engine/types';;

class ServicesRegistry implements CloudServiceRegistry {
  /**
   * @var {Object} items the items in the registry
   */
  items: {
    [key in ProviderChoice]?: { [type in ServiceTypeChoice]?: CloudServiceConstructor };
  } = {};

  /**
   * Adds a service to the registry
   *
   * @param {ServiceConstructor} classConstructor the service class to add to the registry
   * @param {ProviderChoice} provider the provider that the service uses
   * @param {ServiceTypeChoice} type the service's type
   */
  add(
    classConstructor: CloudServiceConstructor,
    provider: ProviderChoice,
    type: ServiceTypeChoice,
  ): void {
    if (!this.items[provider]) {
      this.items[provider] = {};
    }

    this.items[provider][type] = classConstructor;
  }

  /**
   * Gets a service from the registry
   *
   * @param {ProviderChoice} provider the provider to get the service type for
   * @param {ServiceTypeChoice} type the type of the service to get
   * @returns {CloudServiceConstructor} the service constructor
   * @throws {Error} if the service is not registered
   */
  get(provider: ProviderChoice, type: ServiceTypeChoice): CloudServiceConstructor {
    if (!this.items[provider]) {
      throw new Error(`Provider ${provider} is not registered`);
    }

    if (!this.items[provider][type]) {
      throw new Error(`Provider ${provider} does not have service ${type} registered`);
    }

    return this.items[provider][type];
  }

  /**
   * Returns whether a service exists for a certain provider
   *
   * @param {ProviderChoice} provider the provider to check whether the service exists
   * @param {ServiceTypeChoice} service the service to check whether exists
   * @returns {Boolean} whether the provider specified has the service requested
   */
  exists(provider: ProviderChoice, service: ServiceTypeChoice): boolean {
    return Boolean(this.items[provider]) && Boolean(this.items[provider][service]);
  }

  /**
   * Returns the available service types for a provider
   *
   * @param {ProviderChoice} provider the provider to get the service types
   */
  types(provider: ProviderChoice): ServiceTypeChoice[] {
    if (!this.items[provider]) {
      return [];
    }

    return Object.keys(this.items[provider]);
  }

  providers(service: ServiceTypeChoice): ProviderChoice[] {
  }
}

const registry = new ServicesRegistry();

// Add the local services to the registry
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
 * @param attrs the attributes to instantiate the service by
 * @param scope the scope to apply to the service
 * @returns {CloudService} the service instantiated and with the scope applied
 */
export const getService = (
  attrs: ServiceAttributes, scope: ServiceScopeChoice = 'deployable',
) => {
  const { provider, type } = attrs;
  return registry.get({ provider, type }).factory(attrs).scope(scope);
};

export default registry as ServicesRegistry;
