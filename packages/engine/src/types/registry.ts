import { ProviderChoice, ServiceTypeChoice, ServiceConstructor } from '@stackmate/engine/types/service';

export type TypeServiceMapping = Map<ServiceTypeChoice, ServiceConstructor>;

export interface ServiceRegistry {
  items: Map<ProviderChoice, TypeServiceMapping>;
  add(
    classConstructor: ServiceConstructor, provider: ProviderChoice, type: ServiceTypeChoice,
  ): void;
  get(provider: ProviderChoice, type: ServiceTypeChoice): ServiceConstructor;
}
