import { MinMax } from '@stackmate/engine/lib';
import { BaseServiceAttributes, withSchema } from './core';

/**
 * @type {ConnectableAttributes} port-specific attributes
 */

export type ConnectableAttributes = { port: number; };
/**
 * Adds TCP port connection support to a service (eg. the port 3306 for a MySQL database)
 *
 * @param {Number} defaultPort the default port that the service accepts connections in
 * @param {Object} opts
 * @param {Number} opts.min the minimum port number
 * @param {Number} opts.max the maximum port number
 * @returns {Function<Service>}
 */

export const connectable = <C extends BaseServiceAttributes>(
  defaultPort: number, { min = 1, max = 65535 }: MinMax = {}
) => withSchema<C, { port: number; }>({
  type: 'object',
  properties: {
    port: {
      type: 'number',
      minimum: min,
      maximum: max,
      default: defaultPort,
      errorMessage: {
        minimum: `The service’s port must be be between ${min} and ${max}`,
        maximum: `The service’s port must be be between ${min} and ${max}`,
      },
    },
  }
});
