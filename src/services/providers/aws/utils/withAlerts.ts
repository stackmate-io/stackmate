import { isEmpty } from 'lodash'
import { getMonitoringPrerequisites } from '@aws/utils/getMonitoringPrerequisites'
import type { Stack } from '@src/lib/stack'
import type { BaseProvisionable } from '@src/services/types'
import type {
  AwsAlertPrerequisites,
  AwsServiceAlertResources,
  MonitoredServiceProvisionable,
} from '@aws/types'

/**
 * @type {AwsServiceAlertsGenerator} describes an alert generator function
 */
export type AwsServiceAlertsGenerator = (
  provisionable: BaseProvisionable,
  stack: Stack,
  resources: BaseProvisionable['provisions'],
  prerequisites: AwsAlertPrerequisites,
) => AwsServiceAlertResources

/**
 * @param {MonitoredServiceProvisionable} provisionable the provisionable to set the alerts for
 * @param {Stack} stack the stack to deploy the resources on
 * @param {AwsServiceAlertsGenerator} alertsGenerator the alarm generator function
 * @returns {ProvisionResources} the resources to be deployed in the stack
 */
export const withAwsAlerts =
  <T extends MonitoredServiceProvisionable>(
    provisionable: T,
    stack: Stack,
    alertsGenerator: AwsServiceAlertsGenerator,
  ) =>
  (resources: T['provisions']): T['provisions'] | (T['provisions'] & AwsServiceAlertResources) => {
    const {
      config: { monitoring },
    } = provisionable

    // Monitoring not configured, bail...
    if (isEmpty(monitoring) || (isEmpty(monitoring.emails) && isEmpty(monitoring.urls))) {
      return resources as T['provisions']
    }

    const prerequisites = getMonitoringPrerequisites(provisionable, stack)
    const alerts = alertsGenerator(provisionable, stack, resources, prerequisites)

    return {
      ...resources,
      ...alerts,
    }
  }
