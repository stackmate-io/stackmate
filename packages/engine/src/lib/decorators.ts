import 'reflect-metadata';

import Entity from '@stackmate/engine/lib/entity';
import { Attribute } from '../types';

export const attr = function Attribute<T>(target: Entity, propertyKey: string) {
  if (!(target instanceof Entity)) {
    throw new Error('The `Attribute` decorator only applies to `Entity` objects');
  }

  target.registerAttribute(propertyKey);

  const getter = function getter(this: Entity): Attribute<T> {
    return this.getAttribute(propertyKey);
  };

  const setter = function setter(this: Entity, value: any) {
    this.setAttribute(propertyKey, value as Attribute<T>);
  };

  Object.defineProperty(target, propertyKey, {
    get: getter,
    set: setter,
    configurable: false,
    enumerable: true,
  });
};

export const WithStaticType = function WithFactory<T>() {
  return <U extends T>(constructor: U) => { constructor };
}
