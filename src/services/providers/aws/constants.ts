import path from 'node:path'
import { SERVICE_TYPE } from '@src/constants'
import { readJsonFile } from '@src/lib/file'
import type { AwsDbServiceType, RdsEngine, AwsServiceConstraints } from './types'

export const DEFAULT_VPC_IP = '10.0.0.0' as const
export const DEFAULT_RDS_INSTANCE_SIZE = 'db.t3.micro' as const
export const DEFAULT_ELASTICACHE_INSTANCE_SIZE = 'cache.t4g.micro' as const
export const DEFAULT_RDS_ENGINE = 'mysql' as const

export const REGIONS = readJsonFile<string[]>(path.join(__dirname, 'regions.json'))
export const CONSTRAINTS = readJsonFile<AwsServiceConstraints>(
  path.join(__dirname, 'constraints.json'),
)

export const RDS_ENGINE_PER_SERVICE_TYPE: Record<AwsDbServiceType, RdsEngine> = {
  [SERVICE_TYPE.MYSQL]: 'mysql',
  [SERVICE_TYPE.MARIADB]: 'mariadb',
  [SERVICE_TYPE.POSTGRESQL]: 'postgres',
}

export const RDS_LOG_EXPORTS_PER_ENGINE: Record<RdsEngine, string[]> = {
  mariadb: ['audit', 'error', 'general', 'slowquery'],
  mysql: ['audit', 'error', 'general', 'slowquery'],
  postgres: ['postgresql', 'upgrade'],
} as const
