import type { dbInstance, dbParameterGroup } from '@cdktf/provider-aws'

const instance: Partial<dbInstance.DbInstanceConfig> = {
  allowMajorVersionUpgrade: false,
  autoMinorVersionUpgrade: true,
  backupRetentionPeriod: 0,
  copyTagsToSnapshot: true,
  deleteAutomatedBackups: true,
  deletionProtection: false,
  enabledCloudwatchLogsExports: ['error'],
  multiAz: false,
  publiclyAccessible: false,
  skipFinalSnapshot: true,
  storageType: 'gp2',
}

const params: dbParameterGroup.DbParameterGroupParameter[] = [
  {
    name: 'character_set_server',
    value: 'utf8mb4',
  },
  {
    name: 'character_set_client',
    value: 'utf8mb4',
  },
  {
    name: 'character_set_connection',
    value: 'utf8mb4',
  },
  {
    name: 'character_set_database',
    value: 'utf8mb4',
  },
  {
    name: 'character_set_results',
    value: 'utf8mb4',
  },
]

export { instance, params }
