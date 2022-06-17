import { RegionList } from '@stackmate/engine/types';

export const AWS_REGIONS: RegionList = {
  EU_CENTRAL_1: 'eu-central-1',
} as const;

export const AWS_DEFAULT_REGION = AWS_REGIONS.EU_CENTRAL_1;

export const DEFAULT_RDS_INSTANCE_SIZE = 'db.t3.micro' as const;

export const DEFAULT_RDS_ENGINE = 'mysql';

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
] as const;

export const RDS_ENGINES = [
  'mariadb',
  'mysql',
  'postgres',
] as const;

export const RDS_PARAM_FAMILY_MAPPING = [
  ['mariadb', '10.2', 'mariadb10.2'],
  ['mariadb', '10.3', 'mariadb10.3'],
  ['mariadb', '10.4', 'mariadb10.4'],
  ['mariadb', '10.5', 'mariadb10.5'],
  ['mysql', '5.6', 'mysql5.6'],
  ['mysql', '5.7', 'mysql5.7'],
  ['mysql', '8', 'mysql8.0'],
  ['postgres', '13', 'postgres13'],
  ['postgres', '12', 'postgres12'],
  ['postgres', '11', 'postgres11'],
  ['postgres', '10', 'postgres10'],
  ['postgres', '9', 'postgres9.6'],
] as const;

export const RDS_MAJOR_VERSIONS_PER_ENGINE: Map<string, Array<string>> = new Map([
  ['mariadb', ['10.5', '10.4', '10.3', '10.2']],
  ['mysql', ['8.0', '5.7', '5.6']],
  ['postgres', ['13', '12', '11', '10', '9.6']],
]);

export const RDS_LOG_EXPORTS_PER_ENGINE: Map<string, Array<string>> = new Map([
  ['mariadb', ['audit', 'error', 'general', 'slowquery']],
  ['mysql', ['audit', 'error', 'general', 'slowquery']],
  ['postgres', ['postgresql', 'upgrade']],
]);

export const RDS_DEFAULT_VERSIONS_PER_ENGINE: Map<string, string> = new Map([
  ['mariadb', '10.5'],
  ['mysql', '8.0'],
  ['postgres', '13'],
]);
