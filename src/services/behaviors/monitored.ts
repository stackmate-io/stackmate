import type { BaseServiceAttributes, Provisions, Service } from '@services/types'
import type { Provisionable } from '../types/provisionable'
import { withSchema } from './withSchema'

export type MonitoringAttributes = {
  monitoring: {
    emails: string[]
    urls: string[]
  }
}

export type MonitoredServiceProvisionable = Provisionable<
  Service<BaseServiceAttributes & MonitoringAttributes>,
  Provisions
>

export const monitored = <C extends BaseServiceAttributes>() =>
  withSchema<C, MonitoringAttributes>({
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
  })
