/*
Credits:
https://github.com/cloudposse/terraform-aws-rds-cloudwatch-sns-alarms/blob/master/alarms.tf
*/
import { kebabCase, snakeCase } from 'lodash'
import { cloudwatchMetricAlarm, dbEventSubscription } from '@cdktf/provider-aws'

import type { Stack } from '@core/stack'
import type { AwsDatabaseDeployableProvisionable } from '@providers/aws/services/database'
import type { AwsServiceAlertsGenerator } from '@providers/aws/service'
import type { AwsServiceAlarmResources, AwsAlarmPrerequisites } from '@providers/aws/alarms'

/**
 * @type {RdsMonitoringThresholds} the monitoring thresholds applicable
 */
export type RdsMonitoringThresholds = {
  /** The minimum percent of gp2 SSD I/O credits available */
  burstBalance: number
  /** Maximum percentage of CPU utilization */
  cpuUtilization: number
  /** Minimum number of credits (t2 class instances only) */
  cpuCreditBalance: number
  /** Maximum number of outstanding read/write requests that are waiting to access the disk */
  diskQueueDepth: number
  /** The minimum amount of available memory (in bytes) */
  freeableMemory: number
  /** The minimum amount of available free storage space (in bytes) */
  freeStorageSpace: number
  /** Maximum amount of swap space used (in bytes) */
  swapUsage: number
}

/**
 * @type {RdsAlarmOptions} the alarm options
 */
export type RdsAlarmOptions = {
  evaluationPeriods: number
  period: number
}

export const thresholds: RdsMonitoringThresholds = {
  burstBalance: 20,
  cpuUtilization: 80,
  cpuCreditBalance: 20,
  diskQueueDepth: 64,
  freeableMemory: 64 * 1024 * 1024, // 64 MB
  freeStorageSpace: 3 * 1024 * 1024 * 1024, // 3 GB
  swapUsage: 256 * 1024 * 1024, // 256MB
}

export const options: RdsAlarmOptions = {
  evaluationPeriods: 1,
  period: 300,
}

export type DatabasebAlertResources =
  | AwsServiceAlarmResources
  | {
      eventSubscription: dbEventSubscription.DbEventSubscription
    }

export const awsDatabaseAlarms: AwsServiceAlertsGenerator = (
  provisionable: AwsDatabaseDeployableProvisionable,
  stack: Stack,
  resources: AwsDatabaseDeployableProvisionable['provisions'],
  prerequisites: AwsAlarmPrerequisites,
): DatabasebAlertResources => {
  const { topic } = prerequisites
  const { dbInstance } = resources
  const {
    config: { name: serviceName },
  } = provisionable

  const eventSubscriptionId = `${provisionable.resourceId}-event-sub`
  const eventSubscription = new dbEventSubscription.DbEventSubscription(
    stack.context,
    eventSubscriptionId,
    {
      name: snakeCase(`${serviceName}-${stack.name}-event-subscription`),
      snsTopic: topic.arn,
      sourceType: 'db-instance',
      sourceIds: [dbInstance.id],
      dependsOn: [dbInstance],
      eventCategories: [
        'failover',
        'failure',
        'low storage',
        'maintenance',
        'notification',
        'recovery',
      ],
    },
  )

  const opts: Omit<
    cloudwatchMetricAlarm.CloudwatchMetricAlarmConfig,
    'alarmName' | 'comparisonOperator' | 'metricName' | 'threshold' | 'alarmDescription'
  > = {
    ...options,
    namespace: 'AWS/RDS',
    statistic: 'Average',
    alarmActions: [topic.arn],
    okActions: [topic.arn],
    dimensions: {
      DBInstanceIdentifier: dbInstance.id,
    },
  }

  const burstBalanceId = `${kebabCase(serviceName)}-${stack.name}-burst-balance-too-low`
  const burstBalance = new cloudwatchMetricAlarm.CloudwatchMetricAlarm(
    stack.context,
    burstBalanceId,
    {
      alarmName: snakeCase(burstBalanceId),
      comparisonOperator: 'LessThanThreshold',
      metricName: 'BurstBalance',
      threshold: thresholds.burstBalance,
      alarmDescription: 'Average database storage burst balance over last 5 minutes too low',
      ...opts,
    },
  )

  const cpuUtilizationId = `${kebabCase(serviceName)}-${stack.name}-cpu-utilization-too-high`
  const cpuUtilization = new cloudwatchMetricAlarm.CloudwatchMetricAlarm(
    stack.context,
    cpuUtilizationId,
    {
      alarmName: snakeCase(cpuUtilizationId),
      comparisonOperator: 'GreaterThanThreshold',
      metricName: 'CPUUtilization',
      threshold: thresholds.cpuUtilization,
      ...opts,
    },
  )

  const cpuUCreditBalanceId = `${kebabCase(serviceName)}-${stack.name}-cpu-credit-balance-too-low`
  const cpuCreditBalance = new cloudwatchMetricAlarm.CloudwatchMetricAlarm(
    stack.context,
    cpuUCreditBalanceId,
    {
      alarmName: snakeCase(cpuUCreditBalanceId),
      comparisonOperator: 'LessThanThreshold',
      metricName: 'CPUCreditBalance',
      threshold: thresholds.cpuCreditBalance,
      ...opts,
    },
  )

  const diskQueueDepthId = `${kebabCase(serviceName)}-${stack.name}-disk-depth-too-high`
  const diskQueueDepth = new cloudwatchMetricAlarm.CloudwatchMetricAlarm(
    stack.context,
    diskQueueDepthId,
    {
      alarmName: snakeCase(diskQueueDepthId),
      comparisonOperator: 'GreaterThanThreshold',
      metricName: 'DiskQueueDepth',
      threshold: thresholds.diskQueueDepth,
      ...opts,
    },
  )

  const freeableMemoryId = `${kebabCase(serviceName)}-${stack.name}-freeable-memory-too-low`
  const freeableMemory = new cloudwatchMetricAlarm.CloudwatchMetricAlarm(
    stack.context,
    freeableMemoryId,
    {
      alarmName: snakeCase(freeableMemoryId),
      comparisonOperator: 'LessThanThreshold',
      metricName: 'FreeableMemory',
      threshold: thresholds.freeableMemory,
      ...opts,
    },
  )

  const freeStorageId = `${kebabCase(serviceName)}-${stack.name}-free-storage-space-too-low`
  const freeStorage = new cloudwatchMetricAlarm.CloudwatchMetricAlarm(
    stack.context,
    freeStorageId,
    {
      alarmName: snakeCase(freeStorageId),
      comparisonOperator: 'LessThanThreshold',
      metricName: 'FreeStorageSpace',
      threshold: thresholds.freeStorageSpace,
      ...opts,
    },
  )

  const swapSpaceId = `${kebabCase(serviceName)}-${stack.name}-swap-usage-too-high`
  const swapSpace = new cloudwatchMetricAlarm.CloudwatchMetricAlarm(stack.context, swapSpaceId, {
    alarmName: snakeCase(swapSpaceId),
    comparisonOperator: 'GreaterThanThreshold',
    metricName: 'SwapUsage',
    threshold: thresholds.swapUsage,
    ...opts,
  })

  return {
    burstBalance,
    cpuUtilization,
    cpuCreditBalance,
    diskQueueDepth,
    freeableMemory,
    freeStorage,
    swapSpace,
    eventSubscription,
  }
}
