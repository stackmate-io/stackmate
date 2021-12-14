import { DbInstanceConfig, DbParameterGroupParameter } from '@cdktf/provider-aws/lib/rds';

const instance: Partial<DbInstanceConfig> = {
  allowMajorVersionUpgrade: false,
  applyImmediately: true,
  autoMinorVersionUpgrade: true,
  backupRetentionPeriod: 0,
  copyTagsToSnapshot: true,
  deleteAutomatedBackups: true,
  deletionProtection: false,
  enabledCloudwatchLogsExports: ['error'],
  multiAz: false,
  publiclyAccessible: true,
  skipFinalSnapshot: true,
  storageType: 'gp2',
};

const params: Array<DbParameterGroupParameter> = [{
  name: 'character_set_server',
  value: 'utf8mb4',
}, {
  name: 'character_set_client',
  value: 'utf8mb4',
}, {
  name: 'character_set_connection',
  value: 'utf8mb4',
}, {
  name: 'character_set_database',
  value: 'utf8mb4',
}, {
  name: 'character_set_results',
  value: 'utf8mb4',
}];

export {
  instance,
  params,
};
