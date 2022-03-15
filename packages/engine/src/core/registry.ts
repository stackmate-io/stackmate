import Registry from '@stackmate/engine/lib/registry';
import * as AwsServices from '@stackmate/engine/providers/aws';
import * as LocalServices from '@stackmate/engine/providers/local';
import { BaseEntityConstructor, CloudService } from '@stackmate/engine/interfaces';
import { ProviderChoice, ServiceAttributes, ServiceScopeChoice, ServiceTypeChoice } from '@stackmate/engine/types';
import { PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';

interface ServiceConstructor extends BaseEntityConstructor<CloudService> {}

class ServicesRegistry extends Registry<ServiceConstructor> {
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
    super.add(classConstructor, provider, type);
  }
}

const registry = new ServicesRegistry();

// Add the local services to the registry
registry.add(LocalServices.State, PROVIDER.LOCAL, SERVICE_TYPE.STATE);

// Add the AWS services to the registry
registry.add(AwsServices.Provider, PROVIDER.AWS, SERVICE_TYPE.PROVIDER);
registry.add(AwsServices.Database, PROVIDER.AWS, SERVICE_TYPE.DATABASE);
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
