import pipe from '@bitty/pipe';
import { isEmpty } from 'lodash';

import {
  associate, AssociationHandler, BaseServiceAttributes, Service,
  withSchema, ServiceSideEffect, ProvisionResources, WithAssociations,
} from '@stackmate/engine/core/service/core';

/**
 * @type {AlertableAttributes} internal link service attributes
 */
export type AlertableAttributes = { alerts: { email: string; } };

/**
 * @type {AlertingHandler} the function who handles service linking
 */
export type AlertingHandler = AssociationHandler<
  ProvisionResources, BaseServiceAttributes & AlertableAttributes
>;

/**
 * @type {AlertableAssociations} associations for alertable services
 */
export type AlertableAssociations = {
  deployable: { alertable: ServiceSideEffect; };
};

/**
 * Adds link support to a service (allows it to be linked to other services)
 *
 * @param {AlertingHandler} onServiceLinked the function handling service links
 * @returns {Function<Service>}
 */
export const withAlerts = <C extends BaseServiceAttributes>(
  onServiceLinked: AlertingHandler,
) => <T extends Service<C>>(srv: T): WithAssociations<T, AlertableAssociations> => (
  pipe(
    withSchema<C, AlertableAttributes>({
      type: 'object',
      properties: {
        alerts: {
          type: 'object',
          default: {},
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'The email address to send the alerts to',
            },
          },
        },
      },
    }),
    associate({
      deployable: {
        alertable: {
          handler: onServiceLinked,
          where: (config: C & AlertableAttributes): boolean => (
            !isEmpty(config.alerts)
          ),
        },
      },
    }),
  )(srv)
);
