import { isEmpty } from 'lodash'
import { getMonitoringPrerequisites } from '@aws/utils/getMonitoringPrerequisites'
import type { Stack } from '@lib/stack'
import type { BaseProvisionable } from '@services/types'
import type { AwsAlertPrerequisites, AwsServiceAlertResources } from '@aws/types'
import type { MonitoredServiceProvisionable } from '@src/services/behaviors'

export type AwsServiceAlertsGenerator = (
  provisionable: BaseProvisionable,
  stack: Stack,
  resources: BaseProvisionable['provisions'],
  prerequisites: AwsAlertPrerequisites,
) => AwsServiceAlertResources

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
