import { Stack } from '@stackmate/engine/core/stack';
import { AwsDatabaseDeployableProvisionable } from '@stackmate/engine/providers/aws/services/database';
import { AwsMonitoringDeployableProvisionable, AwsMonitoringPrerequisites } from '@stackmate/engine/providers/aws/services/monitoring';

export type DatabasebAlertResources = {};

export const databaseAlerts = (
  alerts: AwsMonitoringDeployableProvisionable,
  stack: Stack,
  db: AwsDatabaseDeployableProvisionable,
  prerequisites: AwsMonitoringPrerequisites,
): DatabasebAlertResources => {
  const { } = prerequisites;
  return {};
};

