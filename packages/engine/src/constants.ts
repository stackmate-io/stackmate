export const { env: ENV } = process;
export const DEFAULT_RESOURCE_COMMENT = 'Deployed by Stackmate';
export const DEBUG_MODE = Boolean(ENV.DEBUG) || false;

export const PROVIDER = {
  AWS: 'aws',
  LOCAL: 'local',
} as const;

export const SERVICE_TYPE = {
  CDN: 'cdn',
  DNS: 'dns',
  ELASTIC_STORAGE: 'elasticstorage',
  INSTANCE: 'instance',
  LOAD_BALANCER: 'loadbalancer',
  MEMCACHED: 'memcached',
  MAILER: 'mailer',
  MARIADB: 'mariadb',
  MYSQL: 'mysql',
  POSTGRESQL: 'postgresql',
  PROVIDER: 'provider',
  REDIS: 'redis',
  SSL: 'ssl',
  STATE: 'state',
  VAULT: 'vault',
  VOLUME: 'volume',
} as const;

export const STORAGE: { [name: string]: string } = {
  FILE: 'file',
} as const;

// Service defaults
export const DEFAULT_IP = '10.0.0.0';
