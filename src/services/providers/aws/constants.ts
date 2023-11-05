import { SERVICE_TYPE } from '@src/constants'
import type { ServiceTypeChoice } from '@services/types'

export type RdsEngine = 'mariadb' | 'mysql' | 'postgres'

export const DEFAULT_RDS_INSTANCE_SIZE = 'db.t3.micro' as const
export const DEFAULT_RDS_ENGINE = 'mysql' as const
export const DEFAULT_VPC_IP = '10.0.0.0' as const

export const REGIONS = ['eu-central-1'] as const

export type AwsDbServiceType = Extract<ServiceTypeChoice, 'mysql' | 'mariadb' | 'postgresql'>
export const RDS_ENGINE_PER_SERVICE_TYPE: Record<AwsDbServiceType, RdsEngine> = {
  [SERVICE_TYPE.MYSQL]: 'mysql',
  [SERVICE_TYPE.MARIADB]: 'mariadb',
  [SERVICE_TYPE.POSTGRESQL]: 'postgres',
}

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
] as const

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
] as const

export const RDS_MAJOR_VERSIONS_PER_ENGINE: Record<RdsEngine, readonly string[]> = {
  mariadb: ['10.5', '10.4', '10.3', '10.2'],
  mysql: ['8.0', '5.7', '5.6'],
  postgres: ['13', '12', '11', '10', '9.6'],
} as const

export const RDS_LOG_EXPORTS_PER_ENGINE: Record<RdsEngine, readonly string[]> = {
  mariadb: ['audit', 'error', 'general', 'slowquery'],
  mysql: ['audit', 'error', 'general', 'slowquery'],
  postgres: ['postgresql', 'upgrade'],
} as const

export const RDS_DEFAULT_VERSIONS_PER_ENGINE: Record<RdsEngine, string> = {
  mariadb: '10.5',
  mysql: '8.0',
  postgres: '13',
} as const
