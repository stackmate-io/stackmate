import { RegionList } from '@stackmate/types';

export const AWS_REGIONS: RegionList = {
  EU_CENTRAL_1: 'eu-central-1',
} as const;

// Defaults
export const DEFAULT_INSTANCE_STORAGE = 30;

// RDS service
export const DEFAULT_RDS_INSTANCE_STORAGE = DEFAULT_INSTANCE_STORAGE;

export const DEFAULT_RDS_INSTANCE_SIZE = 'db.t3.micro';

export const DEFAULT_MYSQL_ENGINE = 'mysql';

export const DEFAULT_POSTGRES_ENGINE = 'postgres';

export const RDS_INSTANCE_SIZES = [
  'db.t3.micro',
  'db.t3.small',
  'db.t3.medium',
  'db.t3.large',
  'db.t3.xlarge',
  'db.t3.2xlarge',
  'db.t2.micro',
  'db.t2.small',
  'db.t2.medium',
  'db.t2.large',
  'db.t2.xlarge',
  'db.t2.2xlarge',
  'db.m4.large',
  'db.m4.xlarge',
  'db.m4.2xlarge',
  'db.m4.4xlarge',
  'db.m4.10xlarge',
  'db.m4.16xlarge',
  'db.m5.large',
  'db.m5.xlarge',
  'db.m5.2xlarge',
  'db.m5.4xlarge',
  'db.m5.12xlarge',
  'db.m5.24xlarge',
];

export const RDS_ENGINES = [
  'mariadb',
  'mysql',
  'postgres',
];
