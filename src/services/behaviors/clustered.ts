import type { BaseServiceAttributes } from '@services/types'
import { withSchema } from './withSchema'

/**
 * @type {ClusteredAttributes} cluster attributes
 */
export type ClusteredAttributes = { cluster: boolean }

/**
 * Adds cluster support to a service (eg. databases or cache clusters)
 *
 * @param {Boolean} isClusterDefault whether to use a cluster by default
 * @returns {Function<Service>}
 */

export const clustered = <C extends BaseServiceAttributes>(isClusterDefault = false) =>
  withSchema<C, ClusteredAttributes>({
    type: 'object',
    properties: {
      cluster: {
        type: 'boolean',
        default: isClusterDefault,
      },
    },
  })
