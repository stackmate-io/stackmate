/*
Credits:
https://github.com/cloudposse/terraform-aws-rds-cloudwatch-sns-alarms/blob/master/alarms.tf
*/
import { kebabCase, snakeCase } from 'lodash';
import { cloudwatchMetricAlarm, dbEventSubscription } from '@cdktf/provider-aws';

import { Stack } from '@stackmate/engine/core/stack';
import { PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';
import { getServiceProfile } from '@stackmate/engine/core/profile';
import { RdsAlarmOptions, RdsMonitoringThresholds } from '@stackmate/engine/profiles/aws/monitoring/database';
import { AwsDatabaseDeployableProvisionable } from '@stackmate/engine/providers/aws/services/database';
import { AwsAlarms, AwsMonitoringDeployableProvisionable, AwsMonitoringPrerequisites } from '@stackmate/engine/providers/aws/services/monitoring';

export type DatabasebAlertResources = AwsAlarms | {
  eventSubscription: dbEventSubscription.DbEventSubscription;
};

export const databaseAlerts = (
  alerts: AwsMonitoringDeployableProvisionable,
  stack: Stack,
  db: AwsDatabaseDeployableProvisionable,
  prerequisites: AwsMonitoringPrerequisites,
): DatabasebAlertResources => {
  const { topic, policy } = prerequisites;
  const { config: { name: serviceName }, provisions: { dbInstance } } = db;
  const { thresholds, options } = getServiceProfile(PROVIDER.AWS, SERVICE_TYPE.MONITORING, 'database') as {
    thresholds: RdsMonitoringThresholds;
    options: RdsAlarmOptions,
  };

  const eventSubscriptionId = `${db.resourceId}-event-sub`;
  const eventSubscription = new dbEventSubscription.DbEventSubscription(
    stack.context, eventSubscriptionId, {
      name: kebabCase(`${db.config.name}-${stack.stageName}-event-subscription`),
      snsTopic: topic.arn,
      sourceType: 'db-instance',
      sourceIds: [dbInstance.id],
      dependsOn: [policy, dbInstance],
      eventCategories: [
        'failover',
        'failure',
        'low storage',
        'maintenance',
        'notification',
        'recovery',
      ],
    },
  );

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
  };

  const burstBalanceId = `${kebabCase(serviceName)}-${stack.stageName}-burst-balance-too-low`;
  const burstBalance = new cloudwatchMetricAlarm.CloudwatchMetricAlarm(
    stack.context, burstBalanceId, {
      alarmName: snakeCase(burstBalanceId),
      comparisonOperator: 'LessThanThreshold',
      metricName: 'BurstBalance',
      threshold: thresholds.burstBalance,
      alarmDescription: 'Average database storage burst balance over last 5 minutes too low',
      ...opts,
    },
  );

  const cpuUtilizationId = `${kebabCase(serviceName)}-${stack.stageName}-cpu-utilization-too-high`;
  const cpuUtilization = new cloudwatchMetricAlarm.CloudwatchMetricAlarm(
    stack.context, cpuUtilizationId, {
      alarmName: snakeCase(cpuUtilizationId),
      comparisonOperator: 'GreaterThanThreshold',
      metricName: 'CPUUtilization',
      threshold: thresholds.cpuUtilization,
      ...opts,
    },
  );

  const cpuUCreditBalanceId = `${kebabCase(serviceName)}-${stack.stageName}-cpu-credit-balance-too-low`;
  const cpuCreditBalance = new cloudwatchMetricAlarm.CloudwatchMetricAlarm(
    stack.context, cpuUCreditBalanceId, {
      alarmName: snakeCase(cpuUCreditBalanceId),
      comparisonOperator: 'LessThanThreshold',
      metricName: 'CPUCreditBalance',
      threshold: thresholds.cpuCreditBalance,
      ...opts,
    },
  );

  const diskQueueDepthId = `${kebabCase(serviceName)}-${stack.stageName}-disk-depth-too-high`;
  const diskQueueDepth = new cloudwatchMetricAlarm.CloudwatchMetricAlarm(
    stack.context, diskQueueDepthId, {
      alarmName: snakeCase(diskQueueDepthId),
      comparisonOperator: 'GreaterThanThreshold',
      metricName: 'DiskQueueDepth',
      threshold: thresholds.diskQueueDepth,
      ...opts,
    },
  );

  const freeableMemoryId = `${kebabCase(serviceName)}-${stack.stageName}-freeable-memory-too-low`;
  const freeableMemory = new cloudwatchMetricAlarm.CloudwatchMetricAlarm(
    stack.context, freeableMemoryId, {
      alarmName: snakeCase(freeableMemoryId),
      comparisonOperator: 'LessThanThreshold',
      metricName: 'FreeableMemory',
      threshold: thresholds.freeableMemory,
      ...opts,
    },
  );

  const freeStorageId = `${kebabCase(serviceName)}-${stack.stageName}-free-storage-space-too-low`;
  const freeStorage = new cloudwatchMetricAlarm.CloudwatchMetricAlarm(
    stack.context, freeStorageId, {
      alarmName: snakeCase(freeStorageId),
      comparisonOperator: 'LessThanThreshold',
      metricName: 'FreeStorageSpace',
      threshold: thresholds.freeStorageSpace,
      ...opts,
    },
  );

  const swapSpaceId = `${kebabCase(serviceName)}-${stack.stageName}-swap-usage-too-high`;
  const swapSpace = new cloudwatchMetricAlarm.CloudwatchMetricAlarm(
    stack.context, swapSpaceId, {
      alarmName: snakeCase(swapSpaceId),
      comparisonOperator: 'GreaterThanThreshold',
      metricName: 'SwapUsage',
      threshold: thresholds.swapUsage,
      ...opts,
    },
  );

  return {
    burstBalance,
    cpuUtilization,
    cpuCreditBalance,
    diskQueueDepth,
    freeableMemory,
    freeStorage,
    swapSpace,
    eventSubscription,
  };
};

