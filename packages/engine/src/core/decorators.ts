const Cached = () => {
  const _cache: { [key: string]: any } = {};

  return (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      const lookup = `${propertyKey}__${args.map(a => a.toString()).join('-')}`;

      if (Object.keys(_cache).includes(lookup)) {
        _cache[lookup] = originalMethod.apply(this, args);
      }

      return _cache[lookup];
    }
  };
};

export {
  Cached,
};
