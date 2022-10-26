/*
Credits:
https://github.com/cloudposse/terraform-aws-rds-cloudwatch-sns-alarms/blob/master/alarms.tf
*/
export type RdsMonitoringThresholds = {
  /** The minimum percent of gp2 SSD I/O credits available */
  burstBalance: number;
  /** Maximum percentage of CPU utilization */
  cpuUtilization: number;
  /** Minimum number of credits (t2 class instances only) */
  cpuCreditBalance: number;
  /** Maximum number of outstanding read/write requests that are waiting to access the disk */
  diskQueueDepth: number;
  /** The minimum amount of available memory (in bytes) */
  freeableMemory: number;
  /** The minimum amount of available free storage space (in bytes) */
  freeStorageSpace: number;
  /** Maximum amount of swap space used (in bytes) */
  swapUsage: number;
};

export type RdsAlarmOptions = {
  evaluationPeriods: number,
  period: number,
};

export const thresholds: RdsMonitoringThresholds = {
  burstBalance: 20,
  cpuUtilization: 80,
  cpuCreditBalance: 20,
  diskQueueDepth: 64,
  freeableMemory: 64 * 1024 * 1024, // 64 MB
  freeStorageSpace: 3 * 1024 * 1024 * 1024, // 3 GB
  swapUsage: 256 * 1024 * 1024, // 256MB
};

export const options: RdsAlarmOptions = {
  evaluationPeriods: 1,
  period: 300,
};
