import { ServiceSchema } from '@stackmate/engine/core/schema';
import { BaseProvisionable, BaseServiceAttributes, withSchema } from './core';

/**
 * @type {MonitoredAttributes} the attributes to use for monitoring
 */
export type MonitoredAttributes = {
  monitoring: boolean;
};

/**
 * @type {MonitoringAttributes} the configuration to use for setting up the alerts
 */
export type MonitoringAttributes = {
  emails: string[];
  enabled: boolean;
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
export const getMonitoringAttributesSchema = (): ServiceSchema<MonitoringAttributes> => ({
  type: 'object',
  properties: {
    enabled: {
      type: 'boolean',
      default: true,
      description: 'Whether monitoring is enabled or not',
    },
    emails: {
      type: 'array',
      description: 'The list of email addresses to send the alerts to',
      items: {
        type: 'string',
        format: 'email',
        errorMessage: {
          format: '{/email} is not a valid email address',
        },
      },
    },
  }
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
