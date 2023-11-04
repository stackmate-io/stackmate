import { SERVICE_TYPE } from '@constants'
import type { ServiceTypeChoice } from 'src/services/types'

export const DEFAULT_PORT: Map<ServiceTypeChoice, number> = new Map([
  [SERVICE_TYPE.MEMCACHED, 11211],
  [SERVICE_TYPE.MARIADB, 3306],
  [SERVICE_TYPE.MYSQL, 3306],
  [SERVICE_TYPE.POSTGRESQL, 5432],
  [SERVICE_TYPE.REDIS, 6379],
])
