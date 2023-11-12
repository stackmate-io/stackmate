import { SERVICE_TYPE } from '@src/constants'
import type { ServiceTypeChoice } from '@services/types'

export const DEFAULT_VPC_IP = '10.0.0.0' as const
export const REGIONS = ['eu-central-1'] as const

/* RDS options */
export type RdsEngine = 'mariadb' | 'mysql' | 'postgres'
export const DEFAULT_RDS_INSTANCE_SIZE = 'db.t3.micro' as const
export const DEFAULT_RDS_ENGINE = 'mysql' as const
export type AwsDbServiceType = Extract<ServiceTypeChoice, 'mysql' | 'mariadb' | 'postgresql'>

export const RDS_ENGINE_PER_SERVICE_TYPE: Record<AwsDbServiceType, RdsEngine> = {
  [SERVICE_TYPE.MYSQL]: 'mysql',
  [SERVICE_TYPE.MARIADB]: 'mariadb',
  [SERVICE_TYPE.POSTGRESQL]: 'postgres',
}

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

/* Elasticache options */
export type ElasticacheEngine = 'redis' | 'memcached'
export const DEFAULT_ELASTICACHE_INSTANCE_SIZE = 'cache.t3.micro' as const
export const ELASTICACHE_VERSIONS_PER_ENGINE: Record<ElasticacheEngine, readonly string[]> = {
  redis: ['7.0', '6.2', '6.0', '5.0.6', '4.0.10'],
  memcached: [
    '1.6.17',
    '1.6.12',
    '1.6.6',
    '1.5.16',
    '1.5.10',
    '1.4.34',
    '1.4.33',
    '1.4.24',
    '1.4.14',
    '1.4.5',
  ],
} as const

export const ELASTICACHE_DEFAULT_VERSIONS_PER_ENGINE: Record<ElasticacheEngine, string> = {
  redis: '7.0',
  memcached: '1.6.17',
} as const

export const ELASTICACHE_PARAM_FAMILY_MAPPING = [
  ['redis', '7.0', 'default.redis7'],
  ['redis', '7.0', 'default.redis7.cluster.on'],
  ['redis', '6.2', 'default.redis6.x'],
  ['redis', '6.2', 'default.redis6.x.cluster.on'],
  ['redis', '5.0.6', 'default.redis5.0'],
  ['redis', '5.0.6', 'default.redis5.0.cluster.on'],
  ['redis', '4.0.10', 'default.redis4.0'],
  ['redis', '4.0.10', 'default.redis4.0.cluster.on'],
  ['memcached', '1.6.17', 'default.memcached1.6'],
  ['memcached', '1.6.12', 'default.memcached1.6'],
  ['memcached', '1.6.6', 'default.memcached1.6'],
  ['memcached', '1.5.16', 'default.memcached1.5'],
  ['memcached', '1.5.10', 'default.memcached1.5'],
  ['memcached', '1.4.34', 'default.memcached1.4'],
  ['memcached', '1.4.33', 'default.memcached1.4'],
  ['memcached', '1.4.24', 'default.memcached1.4'],
  ['memcached', '1.4.14', 'default.memcached1.4'],
  ['memcached', '1.4.5', 'default.memcached1.4'],
] as const
