import { ProviderChoice } from '@stackmate/types';
import { CloudCollection, CloudProvider, CloudService, CloudStack, VaultService } from '@stackmate/interfaces';

class Collection implements CloudCollection {
  protected clouds: Map<ProviderChoice, CloudProvider>;

  add(cloud: CloudProvider): void {
    this.clouds.set(cloud.provider, cloud);
  }

  forEach(callback: (c: CloudProvider) => void): void {
    for (let cloud of this.clouds.values()) {
      callback(cloud);
    }
  }

  get(provider: ProviderChoice): CloudProvider {
    const cloud = this.clouds.get(provider);

    if (!cloud) {
      throw new Error(`Cloud instance for provider ${provider} was not found`);
    }

    return cloud;
  }

  alias(provider: ProviderChoice, region: string): string | undefined {
    return this.clouds.get(provider)?.aliases.get(region);
  }

  provision(
    stack: CloudStack,
    services: CloudService[],
    { vault, state }: { vault?: VaultService, state?: object /** @todo */ } = {},
  ): void {
    this.clouds.forEach((cloud) => {
      cloud.provision(stack, vault);
    });

    services.forEach((service) => {
      service.provision(stack, vault, this.alias(service.provider, service.region));
    });
  }
}

export default Collection;
