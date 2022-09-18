import { BaseServiceAttributes, withSchema } from './core';

/**
 * @type {SizeableAttributes} size attributes
 */

export type SizeableAttributes = { size: string; };
/**
 * Adds size support to a service (eg. the database instance size)
 *
 * @param {String[]} sizes the available sizes for the service
 * @param {String} defaultSize the default size for the service
 * @returns {Function<Service>}
 */

export const sizeable = <C extends BaseServiceAttributes>(
  sizes: readonly string[], defaultSize: string
) => withSchema<C, SizeableAttributes>({
  type: 'object',
  properties: {
    size: {
      type: 'string',
      enum: sizes,
      default: defaultSize,
      errorMessage: `The size is invalid. Available options are: ${sizes.join(', ')}`
    },
  }
});