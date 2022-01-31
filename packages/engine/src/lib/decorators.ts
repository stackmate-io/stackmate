import 'reflect-metadata';

import Entity from '@stackmate/lib/entity';
import { ProviderChoice, ServiceTypeChoice } from '@stackmate/types';
import { CloudProviderConstructor, CloudServiceConstructor } from '@stackmate/interfaces';

export const Attribute = function Attribute(target: Entity, propertyKey: string) {
  if (!(target instanceof Entity)) {
    throw new Error('The `Attribute` decorator only applies to `Entity` objects');
  }

  target.registerAttribute(propertyKey);

  const getter = function getter(this: Entity) {
    return this.getAttribute(propertyKey);
  };

  const setter = function setter(this: Entity, value: any) {
    this.setAttribute(propertyKey, value);
  };

  Object.defineProperty(target, propertyKey, {
    get: getter,
    set: setter,
    configurable: false,
    enumerable: true,
  });
};

export const RegisterableService = function RegisterableService(
  provider: ProviderChoice,
  type: ServiceTypeChoice,
) {
  return (target: CloudServiceConstructor) => {
    target.registry.add(target, provider, type);
    console.log(target.registry.items);
  }
};

export const RegisterableCloud = function RegisterableCloud(provider: ProviderChoice) {
  return (target: CloudProviderConstructor) => {
    target.registry.add(target, provider);
  }
}
