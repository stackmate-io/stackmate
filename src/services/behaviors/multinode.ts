import { withSchema } from 'src/services/utils'
import type { MinMax } from '@lib/util'
import type { BaseServiceAttributes } from 'src/services/types/util'

/**
 * @type {MultiNodeAttributes} nodes attributes
 */
export type MultiNodeAttributes = { nodes: number }

/**
 * Adds multiple-node support to a service (eg. multiple app server instances)
 * @param {number} defaultNodes the default number of nodes
 * @param {number} opts.min the minimum number of nodes
 * @param {number} opts.max the maximum number of nodes
 * @returns {Function<Service>}
 */
export const multiNode = <C extends BaseServiceAttributes>(
  defaultNodes = 1,
  { min = 1, max = 10000 }: MinMax = {},
) =>
  withSchema<C, MultiNodeAttributes>({
    type: 'object',
    properties: {
      nodes: {
        type: 'number',
        minimum: min,
        maximum: max,
        default: defaultNodes,
        errorMessage: {
          minimum: `The nodes must be between ${min} and ${max}`,
          maximum: `The nodes must be between ${min} and ${max}`,
        },
      },
    },
  })
