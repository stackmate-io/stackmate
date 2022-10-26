import { JsonSchema } from '@stackmate/engine/core/schema';
import { BaseProvisionable, BaseServiceAttributes, withSchema } from './core';

/**
 * @type {MonitoredAttributes} the attributes to use for monitoring
 */
export type MonitoredAttributes = {
  monitoring: boolean;
};

/**
 * @type {AlertingAttributes} the configuration to use for setting up the alerts
 */
export type AlertingAttributes = {
  emails: string[];
};

/**
 * @type {MonitoredProvisionable} the linkable provisionable
 */
export type MonitoredProvisionable = BaseProvisionable<
  BaseServiceAttributes & MonitoredAttributes
>;

/**
 * @returns {ServiceSchema} the schema to use when validating alerting services
 */
export const getAlertingEmailsSchema = (): JsonSchema<AlertingAttributes['emails']> => ({
  type: 'array',
  minItems: 1,
  description: 'The list of email addresses to send the alerts to',
  items: {
    type: 'string',
    format: 'email',
    errorMessage: {
      format: '{/email} is not a valid email address',
    },
  },
  errorMessage: {
    minItems: 'You have to provide at least one email address to alert',
  },
});

/**
 * @param {AlertsGenerator} alertsGenerator the function that generates the service's alerts
 * @returns {Function<Service>}
 */
export const monitored = <C extends BaseServiceAttributes>(
) => withSchema<C, MonitoredAttributes>({
  type: 'object',
  properties: {
    monitoring: {
      type: 'boolean',
      default: true,
      errorMessage: {
        type: 'Monitoring is a boolean value',
      },
    },
  },
});
