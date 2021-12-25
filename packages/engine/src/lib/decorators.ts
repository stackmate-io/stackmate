import 'reflect-metadata';
import Entity from './entity';

export const Cached = () => {
  /**
   * @var {Object} _cache the cache object
   */
  const _cache: { [key: string]: any } = {};

  /**
   * @param {Object} target the object to decorate
   * @param {String} propertyKey the property key the decorator will cache
   * @param {PropertyDescriptor} descriptor the property descriptor
   * @returns {Any} the value returned from the decorated function
   */
  return (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => {
    const { value: originalMethod } = descriptor;

    descriptor.value = function (...args: any[]) {
      const lookup = `${propertyKey}__${args.map(a => a.toString()).join('-')}`;

      if (Object.keys(_cache).includes(lookup)) {
        _cache[lookup] = originalMethod.apply(this, args);
      }

      return _cache[lookup];
    };

    return descriptor.value;
  };
};

export const Attribute = function (target: Entity, propertyKey: string) {
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
