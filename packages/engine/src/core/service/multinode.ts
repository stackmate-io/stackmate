import { MinMax } from '@stackmate/engine/types';
import { BaseServiceAttributes, withSchema } from './core';

/**
 * @type {MultiNodeAttributes} nodes attributes
 */

export type MultiNodeAttributes = { nodes: number; };
/**
 * Adds multiple-node support to a service (eg. multiple app server instances)
 *
 * @param {Number} defaultNodes the default number of nodes
 * @param {Object} opts
 * @param {Number} opts.min the minimum number of nodes
 * @param {Number} opts.max the maximum number of nodes
 * @returns {Function<Service>}
 */

export const multiNode = <C extends BaseServiceAttributes>(
  defaultNodes = 1, { min = 1, max = 10000 }: MinMax = {}
) => withSchema<C, MultiNodeAttributes>({
  type: 'object',
  properties: {
    nodes: {
      type: 'number',
      minimum: min,
      maximum: max,
      default: defaultNodes,
      errorMessage: `The nodes should be between ${min} and ${max}`,
    },
  }
});
