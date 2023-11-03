import pipe from 'lodash/fp/pipe'
import { isEmpty } from 'lodash'

import { SERVICE_TYPE } from '@constants'
import type { ConnectableAttributes } from './connectable'
import type {
  AssociationHandler,
  BaseServiceAttributes,
  Service,
  ServiceSideEffect,
  AssociationLookup,
  WithAssociations,
} from '@core/service/core'
import { associate, withSchema } from '@core/service/core'
import type { ProvisionResources, BaseProvisionable } from '@core/provision'

/**
 * @type {LinkableAttributes} internal link service attributes
 */
export type LinkableAttributes = { links: string[] }

/**
 * @type {ExternallyLinkableAttributes} external link service attributes
 */
export type ExternallyLinkableAttributes = { externalLinks: string[] }

/**
 * @type {LinkableProvisionable} the linkable provisionable
 */
export type LinkableProvisionable = BaseProvisionable<
  BaseServiceAttributes & ConnectableAttributes & LinkableAttributes
>

/**
 * @type {ExternallyLinkableProvisionable} the externally linkable provisionable
 */
export type ExternallyLinkableProvisionable = BaseProvisionable<
  BaseServiceAttributes & ConnectableAttributes & ExternallyLinkableAttributes
>

/**
 * @type {ServiceLinkHandler} the function that handles service linking
 */
export type ServiceLinkHandler = AssociationHandler<ProvisionResources, LinkableProvisionable>

/**
 * @type {ExternalLinkHandler} the function that handles external linking
 */
export type ExternalLinkHandler = AssociationHandler<
  ProvisionResources,
  ExternallyLinkableProvisionable
>

/**
 * @type {LinkableAssociations} associations for services that are linkable
 */
export type LinkableAssociations = {
  linkable: ServiceSideEffect
}

/**
 * @type {LinkableAssociations} associations for services that are linkable
 */
export type ExternallyLinkableAssociations = {
  externallyLinkable: ServiceSideEffect
}

/**
 * Adds link support to a service (allows it to be linked to other services)
 *
 * @param {ServiceLinkHandler} onServiceLinked the function handling service links
 * @returns {Function<Service>}
 */
export const linkable =
  <C extends BaseServiceAttributes>(
    onServiceLinked: ServiceLinkHandler,
    lookup?: AssociationLookup,
  ) =>
  <T extends Service<C>>(srv: T): WithAssociations<T, LinkableAssociations> =>
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
      associate({
        linkable: {
          sideEffect: true,
          handler: onServiceLinked,
          where: (config: C & LinkableAttributes, linkedConfig: BaseServiceAttributes): boolean => {
            if (!config.links.includes(linkedConfig.name)) {
              return false
            }

            if (typeof lookup !== 'function') {
              return false
            }

            return lookup(config, linkedConfig)
          },
        },
      }),
    )(srv)

/**
 * Adds external link support to services
 *
 * @param {ExternalLinkHandler} onExternalLink
 * @returns {Function<Service>}
 */
export const externallyLinkable =
  <C extends BaseServiceAttributes>(onExternalLink: ExternalLinkHandler) =>
  <T extends Service<C>>(srv: T): WithAssociations<T, ExternallyLinkableAssociations> =>
    pipe(
      withSchema<C, ExternallyLinkableAttributes>({
        type: 'object',
        properties: {
          externalLinks: {
            type: 'array',
            default: [],
            items: {
              type: 'string',
              isIpOrCidr: true,
            },
          },
        },
      }),
      associate({
        externallyLinkable: {
          sideEffect: true,
          handler: onExternalLink,
          with: SERVICE_TYPE.PROVIDER,
          where: (config: C & ExternallyLinkableAttributes): boolean =>
            !isEmpty(config.externalLinks),
        },
      }),
    )(srv)
