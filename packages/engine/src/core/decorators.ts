import Command from '@oclif/command';

import { ValidationError } from '@stackmate/core/errors';

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

export const WithErrorHandler = () => {
  /**
   * @param {Command} target the command to decorate
   * @param {String} propertyKey the property key the decorator refers to
   * @param {PropertyDescriptor} descriptor the property descriptor
   * @returns {Any} the return value the command originally returned
   * @throws {Error} when the error is unhandled
   */
  return (target: Command, propertyKey: string, descriptor: PropertyDescriptor) => {
    const fn = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        return await fn.apply(this, args);
      } catch (error) {
        if (error instanceof ValidationError) {
          return target.error(
            (error as ValidationError).formatted(),
          );
        }

        throw error;
      }
    };
  };
};
