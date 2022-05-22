import { ProviderChoice, ServiceTypeChoice, ServiceConstructor } from '@stackmate/engine/types/service';

export interface ServiceRegistry {
  items: { [k in ProviderChoice]?: { [s in ServiceTypeChoice]?: ServiceConstructor } };
  add(
    classConstructor: ServiceConstructor, provider: ProviderChoice, type: ServiceTypeChoice,
  ): void;
  get(provider: ProviderChoice, type: ServiceTypeChoice): ServiceConstructor;
}
