import { DbInstanceConfig } from '@cdktf/provider-aws/lib/rds';

import { instance as instanceDefaults, params } from './default';

const instance: Partial<DbInstanceConfig> = {
  ...instanceDefaults,
  autoMinorVersionUpgrade: false,
  backupRetentionPeriod: 30,
  deleteAutomatedBackups: false,
  deletionProtection: true,
  multiAz: false,
  skipFinalSnapshot: false,
  storageType: 'gp2',
};

export {
  instance,
  params,
};
