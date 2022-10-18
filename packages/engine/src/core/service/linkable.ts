import pipe from '@bitty/pipe';
import { isEmpty } from 'lodash';

import { SERVICE_TYPE } from '@stackmate/engine/constants';
import { ConnectableAttributes } from './connectable';
import {
  associate, AssociationHandler, BaseServiceAttributes, Service,
  withSchema, ServiceSideEffect, AssociationLookup, ProvisionResources, WithAssociations,
} from '@stackmate/engine/core/service/core';

/**
 * @type {LinkableAttributes} internal link service attributes
 */
export type LinkableAttributes = { links: string[]; };

/**
 * @type {ExternallyLinkableAttributes} external link service attributes
 */
export type ExternallyLinkableAttributes = { externalLinks: string[] };

/**
 * @type {ServiceLinkHandler} the function that handles service linking
 */
export type ServiceLinkHandler = AssociationHandler<
  ProvisionResources, BaseServiceAttributes & ConnectableAttributes
>;

/**
 * @type {ExternalLinkHandler} the function that handles external linking
 */
export type ExternalLinkHandler = AssociationHandler<
  ProvisionResources, BaseServiceAttributes & ConnectableAttributes & ExternallyLinkableAttributes
>;

/**
 * Adds link support to a service (allows it to be linked to other services)
 *
 * @param {ServiceLinkHandler} onServiceLinked the function handling service links
 * @returns {Function<Service>}
 */
export const linkable = <C extends BaseServiceAttributes>(
  onServiceLinked: ServiceLinkHandler,
  lookup?: AssociationLookup,
) => <T extends Service<C>>(srv: T): WithAssociations<T, [ServiceSideEffect]> => (
  pipe(
    withSchema<C, LinkableAttributes>({
      type: 'object',
      properties: {
        links: {
          type: 'array',
          default: [],
          serviceLinks: true,
          items: {
            type: 'string',
            pattern: srv.schema.properties.name?.pattern,
          },
        },
      },
    }),
    associate<C, [ServiceSideEffect]>([{
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

/**
 * Adds external link support to services
 *
 * @param {ExternalLinkHandler} onExternalLink
 * @returns {Function<Service>}
 */
export const externallyLinkable = <C extends BaseServiceAttributes>(
  onExternalLink: ExternalLinkHandler,
) => <T extends Service<C>>(srv: T): WithAssociations<T, [ServiceSideEffect]> => (
  pipe(
    withSchema<C, ExternallyLinkableAttributes>({
      type: 'object',
      properties: {
        externalLinks: {
          type: 'array',
          default: [],
          serviceLinks: true,
          items: {
            type: 'string',
            isIpOrCidr: true,
          },
        },
      },
    }),
    associate<C, [ServiceSideEffect]>([{
      scope: 'deployable',
      handler: onExternalLink,
      from: SERVICE_TYPE.PROVIDER,
      where: (config: C & ExternallyLinkableAttributes): boolean => (
        !isEmpty(config.externalLinks)
      ),
    }]),
  )(srv)
);
