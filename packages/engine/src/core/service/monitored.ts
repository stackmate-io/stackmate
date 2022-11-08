import { ServiceSchema } from '@stackmate/engine/core/schema';
import { BaseServiceAttributes, withSchema } from './core';

/**
 * @type {MonitoringAttributes} the configuration to use for setting up the alerts
 */
export type MonitoringAttributes = {
  monitoring: {
    emails: string[];
    urls: string[];
  };
};

/**
 * @returns {ServiceSchema} the schema to use when validating alerting services
 */
export const getMonitoringSchema = (): ServiceSchema<MonitoringAttributes> => ({
  type: 'object',
  description: 'How would you like to monitor your services',
  default: {},
  properties: {
    monitoring: {
      type: 'object',
      properties: {
        urls: {
          type: 'array',
          description: 'The list of URLs to call when an alert occurs',
          default: [],
          items: {
            type: 'string',
            format: 'url',
            errorMessage: {
              format: '{/url} is not a valid URL',
            },
          },
        },
        emails: {
          type: 'array',
          description: 'The list of email addresses to send the alerts to',
          default: [],
          items: {
            type: 'string',
            format: 'email',
            errorMessage: {
              format: '{/email} is not a valid email address',
            },
          },
        },
      },
    },
  },
});

/**
 * @returns {Function<Service>}
 */
export const monitored = <C extends BaseServiceAttributes>(
) => withSchema<C, MonitoringAttributes>(
  getMonitoringSchema(),
);
