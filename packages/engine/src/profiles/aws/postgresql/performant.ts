import { dbInstance } from '@cdktf/provider-aws';

import { instance as instanceDefaults, params } from './default';

const instance: Partial<dbInstance.DbInstanceConfig> = {
  ...instanceDefaults,
  autoMinorVersionUpgrade: false,
  backupRetentionPeriod: 30,
  deleteAutomatedBackups: false,
  deletionProtection: true,
  multiAz: true,
  skipFinalSnapshot: false,
  storageType: 'io1',
};

export {
  instance,
  params,
};
