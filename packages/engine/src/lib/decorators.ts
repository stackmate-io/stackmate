import 'reflect-metadata';

import Entity from '@stackmate/lib/entity';
import ServicesRegistry from '@stackmate/core/registry';
import { ProviderChoice, ServiceTypeChoice } from '@stackmate/types';
import { BaseEntityConstructor, CloudService } from '@stackmate/interfaces';

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

export const RegisterService = function RegisterService(
  provider: ProviderChoice,
  type: ServiceTypeChoice,
) {
  return (target: BaseEntityConstructor<CloudService>) => {
    ServicesRegistry.add(target, provider, type);
  }
};
