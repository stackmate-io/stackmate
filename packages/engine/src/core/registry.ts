import Registry from '@stackmate/lib/registry';
import * as AwsServices from '@stackmate/providers/aws';
import * as LocalServices from '@stackmate/providers/local';
import { BaseEntityConstructor, CloudService } from '@stackmate/interfaces';
import { ProviderChoice, ServiceTypeChoice } from '@stackmate/types';
import { PROVIDER, SERVICE_TYPE } from '@stackmate/constants';

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

export default registry as ServicesRegistry;
