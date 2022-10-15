import pipe from '@bitty/pipe';

import {
  associate, AssociationHandler, BaseServiceAttributes, Service,
  withSchema, ServiceSideEffect, AssociationLookup, Resource,
} from '@stackmate/engine/core/service/core';

/**
 * @type {LinkableAttributes} link attributes
 */
export type LinkableAttributes = { links: string[]; };

/**
 * Adds link support to a service (allows it to be linked to other services)
 *
 * @param {AssociationHandler<void>} onServiceLinked the function handling service links
 * @returns {Function<Service>}
 */
export const linkable = <C extends BaseServiceAttributes>(
  onServiceLinked: AssociationHandler<Resource | void>,
  lookup?: AssociationLookup,
) => <T extends Service<C>>(srv: T): T => (
  pipe(
    withSchema<C, LinkableAttributes>({
      type: 'object',
      properties: {
        links: {
          type: 'array',
          default: [],
          serviceLinks: true,
          items: { type: 'string' },
        },
      },
    }),
    associate<C, ServiceSideEffect[]>([{
      scope: 'deployable',
      handler: onServiceLinked,
      where: (config: C & LinkableAttributes, linkedConfig: BaseServiceAttributes): boolean => {
        if (!config.links.includes(linkedConfig.name)) {
          return false;
        }

        if (typeof lookup !== 'function') {
          return false;
        }

        return lookup(config, linkedConfig);
      },
    }]),
  )(srv)
);
