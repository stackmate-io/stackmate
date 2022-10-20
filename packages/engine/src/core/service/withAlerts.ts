import pipe from '@bitty/pipe';
import { isEmpty } from 'lodash';

import { JsonSchema } from '@stackmate/engine/core/schema';
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
 * @returns {JsonSchema} the JSON schema for the alerts setup
 */
export const getAlertsSchema = (): JsonSchema<AlertableAttributes['alerts']> => ({
  type: 'object',
  default: {},
  properties: {
    email: {
      type: 'string',
      format: 'email',
      description: 'The email address to send the alerts to',
    },
  },
});

/**
 * Adds link support to a service (allows it to be linked to other services)
 *
 * @param {AlertingHandler} onAlertingAssociationLinked the function handling service links
 * @returns {Function<Service>}
 */
export const withAlerts = <C extends BaseServiceAttributes>(
  onAlertingAssociationLinked: AlertingHandler,
) => <T extends Service<C>>(srv: T): WithAssociations<T, AlertableAssociations> => (
  pipe(
    withSchema<C, AlertableAttributes>({
      type: 'object',
      properties: { alerts: getAlertsSchema() },
    }),
    associate({
      deployable: {
        alertable: {
          handler: onAlertingAssociationLinked,
          where: (config: C & AlertableAttributes): boolean => (
            !isEmpty(config.alerts)
          ),
        },
      },
    }),
  )(srv)
);
