import { BaseServiceAttributes, withSchema } from './core';

/**
 * @type {LinkableAttributes} link attributes
 */

export type LinkableAttributes = { links: string[]; };
/**
 * Adds link support to a service (allows it to be linked to other services)
 *
 * @returns {Function<Service>}
 */

export const linkable = <C extends BaseServiceAttributes>() => withSchema<C, LinkableAttributes>({
  type: 'object',
  properties: {
    links: {
      type: 'array',
      default: [],
      serviceLinks: true,
      items: { type: 'string' },
    },
  }
});
