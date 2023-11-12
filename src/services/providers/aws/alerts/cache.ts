/*
Credits:
https://github.com/SPHTech-Platform/terraform-aws-elasticache-redis/blob/main/alarms.tf
*/
import { kebabCase, snakeCase } from 'lodash'
import { cloudwatchMetricAlarm } from '@cdktf/provider-aws'
import type { Stack } from '@lib/stack'
import type { AwsServiceAlertsGenerator } from '@aws/utils/withAlerts'
import type { AwsServiceAlertResources, AwsAlertPrerequisites } from '@aws/types'
import type { AwsCacheProvisionable } from '@aws/services/cache'

/**
 * @type {ElasticacheMonitoringThresholds} the monitoring thresholds applicable
 */
export type ElasticacheMonitoringThresholds = {
  /** Maximum percentage of CPU utilization */
  cpuUtilization: number
  /** The minimum amount of available memory (in bytes) */
  freeableMemory: number
}

export const thresholds: ElasticacheMonitoringThresholds = {
  cpuUtilization: 80,
  freeableMemory: 128 * 1024 * 1024, // 64 MB
}

export const awsCacheAlarms: AwsServiceAlertsGenerator = (
  provisionable: AwsCacheProvisionable,
  stack: Stack,
  resources: AwsCacheProvisionable['provisions'],
  prerequisites: AwsAlertPrerequisites,
): AwsServiceAlertResources => {
  const { topic } = prerequisites
  const { instance, cluster } = resources
  const {
    config: { name: serviceName, cluster: isCluster },
  } = provisionable

  const resource = isCluster ? cluster : instance
  const opts: Omit<
    cloudwatchMetricAlarm.CloudwatchMetricAlarmConfig,
    'alarmName' | 'comparisonOperator' | 'metricName' | 'threshold' | 'alarmDescription'
  > = {
    namespace: 'AWS/ElastiCache',
    statistic: 'Average',
    alarmActions: [topic.arn],
    okActions: [topic.arn],
    dependsOn: resource ? [resource] : [],
    evaluationPeriods: 1,
    period: 300,
    dimensions: {
      CacheClusterId: cluster?.id || instance?.clusterId || '',
    },
  }

  const cpuUtilizationId = `${kebabCase(serviceName)}-${stack.name}-cpu-utilization-too-high`
  const cpuUtilization = new cloudwatchMetricAlarm.CloudwatchMetricAlarm(
    stack.context,
    cpuUtilizationId,
    {
      alarmName: snakeCase(cpuUtilizationId),
      comparisonOperator: 'GreaterThanThreshold',
      metricName: 'CPUUtilization',
      threshold: thresholds.cpuUtilization,
      alarmDescription: `Average CPU usage above ${thresholds.cpuUtilization} for the last 5 minutes`,
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
      alarmDescription: `Average Freeable memory below ${thresholds.freeableMemory} for the last 5 minutes`,
      ...opts,
    },
  )

  return {
    cpuUtilization,
    freeableMemory,
  }
}
