import type { BaseServiceAttributes } from '@services/types'
import { withSchema } from './withSchema'

/**
 * @type {SizeableAttributes} size attributes
 */
export type SizeableAttributes = { size: string }

/**
 * Adds size support to a service (eg. the database instance size)
 *
 * @param {String} pattern the regular expression to match
 * @param {String} defaultSize the default size for the service
 * @returns {Function<Service>}
 */

export const sizeable = <C extends BaseServiceAttributes>(pattern: string, defaultSize: string) =>
  withSchema<C, SizeableAttributes>({
    type: 'object',
    properties: {
      size: {
        type: 'string',
        pattern,
        default: defaultSize,
      },
    },
  })
