import type { BaseServiceAttributes } from '@services/types'
import { withSchema } from './withSchema'

/**
 * @type {SizeableAttributes} size attributes
 */
export type SizeableAttributes = { size: string }

/**
 * Adds size support to a service (eg. the database instance size)
 *
 * @param {String[]} sizes the available sizes for the service
 * @param {String} defaultSize the default size for the service
 * @returns {Function<Service>}
 */

export const sizeable = <C extends BaseServiceAttributes>(
  sizes: readonly string[],
  defaultSize: string,
) =>
  withSchema<C, SizeableAttributes>({
    type: 'object',
    properties: {
      size: {
        type: 'string',
        enum: sizes,
        default: defaultSize,
        errorMessage: {
          enum: `The size must be one of ${sizes.join(', ')}`,
        },
      },
    },
  })
