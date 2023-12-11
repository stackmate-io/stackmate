/*
Credits;
https://github.com/cloudposse/terraform-aws-ecs-cloudwatch-sns-alarms/blob/main/main.tf
*/
import { cloudwatchMetricAlarm } from '@cdktf/provider-aws'
import { snakeCase } from 'lodash'
import type { Stack } from '@src/lib/stack'
import type { AwsServiceAlertsGenerator } from '@aws/utils/withAlerts'
import type { AwsAlertPrerequisites, AwsServiceAlertResources } from '@aws/types'
import type { AwsApplicationProvisionable } from '@aws/services/application'

export type EcsAlertOptions = {
  evaluationPeriods: number
  period: number
}

export type ApplicationMonitoringThresholds = {
  lowCpuUtilization: number
  highCpuUtilization: number
  lowMemoryUtilization: number
  highMemoryUtilization: number
}

export const options: EcsAlertOptions = {
  evaluationPeriods: 1,
  period: 300,
}

export const thresholds: ApplicationMonitoringThresholds = {
  lowCpuUtilization: 20,
  highCpuUtilization: 80,
  lowMemoryUtilization: 20,
  highMemoryUtilization: 80,
}

export const awsApplicationServiceAlarms: AwsServiceAlertsGenerator = (
  provisionable: AwsApplicationProvisionable,
  stack: Stack,
  resources: AwsApplicationProvisionable['provisions'],
  prerequisites: AwsAlertPrerequisites,
): AwsServiceAlertResources => {
  const { topic } = prerequisites
  const { service } = resources
  const {
    config: { name: serviceName },
  } = provisionable

  const opts: Omit<
    cloudwatchMetricAlarm.CloudwatchMetricAlarmConfig,
    'alarmName' | 'comparisonOperator' | 'metricName' | 'threshold' | 'alarmDescription'
  > = {
    ...options,
    namespace: 'AWS/ECS',
    statistic: 'Average',
    alarmActions: [topic.arn],
    okActions: [topic.arn],
    dimensions: {
      ClusterName: service.cluster,
      ServiceName: service.name,
    },
  }

  const cpuUtilizationLowId = `${serviceName}-cpu-utilization-low`
  const cpuUtilizationLow = new cloudwatchMetricAlarm.CloudwatchMetricAlarm(
    stack.context,
    cpuUtilizationLowId,
    {
      alarmName: snakeCase(cpuUtilizationLowId),
      comparisonOperator: 'LessThanThreshold',
      metricName: 'CPUUtilization',
      threshold: thresholds.lowCpuUtilization,
      alarmDescription: `Average service CPU utilization less than ${
        thresholds.lowCpuUtilization
      }% for the last ${options.period / 60} minute(s)`,
      ...opts,
    },
  )

  const cpuUtilizationHighId = `${serviceName}-cpu-utilization-high`
  const cpuUtilizationHigh = new cloudwatchMetricAlarm.CloudwatchMetricAlarm(
    stack.context,
    cpuUtilizationHighId,
    {
      alarmName: snakeCase(cpuUtilizationHighId),
      alarmDescription: `Average service CPU utilization over ${
        thresholds.highCpuUtilization
      }% for the last ${options.period / 60} minute(s)`,
      comparisonOperator: 'GreaterThanThreshold',
      metricName: 'CPUUtilization',
      threshold: thresholds.highCpuUtilization,
      ...opts,
    },
  )

  const memoryUtilizationLowId = `${serviceName}-memory-utilization-low`
  const memoryUtilizationLow = new cloudwatchMetricAlarm.CloudwatchMetricAlarm(
    stack.context,
    memoryUtilizationLowId,
    {
      alarmName: snakeCase(memoryUtilizationLowId),
      comparisonOperator: 'LessThanThreshold',
      metricName: 'MemoryUtilization',
      threshold: thresholds.lowMemoryUtilization,
      alarmDescription: `Average service Memory utilization less than ${
        thresholds.lowMemoryUtilization
      }% for the last ${options.period / 60} minute(s)`,
      ...opts,
    },
  )

  const memoryUtilizationHighId = `${serviceName}-cpu-utilization-high`
  const memoryUtilizationHigh = new cloudwatchMetricAlarm.CloudwatchMetricAlarm(
    stack.context,
    memoryUtilizationHighId,
    {
      alarmName: snakeCase(memoryUtilizationHighId),
      comparisonOperator: 'GreaterThanThreshold',
      metricName: 'MemoryUtilization',
      threshold: thresholds.highMemoryUtilization,
      alarmDescription: `Average service Memory utilization over ${
        thresholds.highCpuUtilization
      }% for the last ${options.period / 60} minute(s)`,
      ...opts,
    },
  )

  return {
    cpuUtilizationLow,
    cpuUtilizationHigh,
    memoryUtilizationLow,
    memoryUtilizationHigh,
  }
}
