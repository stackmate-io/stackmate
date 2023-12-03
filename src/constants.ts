import type { ServiceTypeChoice } from '@services/types'

export const isTestMode = process.env.NODE_ENV === 'test'
export const isDebugMode = Boolean(process.env.DEBUG)

export const PROVIDER = {
  AWS: 'aws',
  LOCAL: 'local',
} as const

export const SERVICE_TYPE = {
  APP: 'application',
  CDN: 'cdn',
  CLUSTER: 'cluster',
  DNS: 'dns',
  OBJECT_STORAGE: 'object-store',
  INSTANCE: 'instance',
  LOAD_BALANCER: 'loadbalancer',
  MEMCACHED: 'memcached',
  MAILER: 'mailer',
  MARIADB: 'mariadb',
  MYSQL: 'mysql',
  NETWORKING: 'networking',
  POSTGRESQL: 'postgresql',
  PROVIDER: 'provider',
  REDIS: 'redis',
  SSL: 'ssl',
  STATE: 'state',
  VOLUME: 'volume',
} as const

export const DEFAULT_PORT: Map<ServiceTypeChoice, number> = new Map([
  [SERVICE_TYPE.MEMCACHED, 11211],
  [SERVICE_TYPE.MARIADB, 3306],
  [SERVICE_TYPE.MYSQL, 3306],
  [SERVICE_TYPE.POSTGRESQL, 5432],
  [SERVICE_TYPE.REDIS, 6379],
])

// Service defaults
export const DEFAULT_RESOURCE_COMMENT = 'Deployed by Stackmate'
export const DEFAULT_PROFILE_NAME = 'default' as const
export const DEFAULT_SERVICE_STORAGE = 30 as const
export const DEFAULT_PASSWORD_LENGTH = 16 as const
