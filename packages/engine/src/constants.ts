export const { env: ENV } = process;
export const DEFAULT_RESOURCE_COMMENT = 'Deployed by Stackmate';
export const DEBUG_MODE = Boolean(ENV.DEBUG) || false;
export const ENVIRONMENT_VARIABLE = {
  OUTPUT_DIR: 'STACKMATE_OUTPUT',
  AWS_ACCESS_KEY_ID: 'STACKMATE_AWS_ACCESS_KEY_ID',
  AWS_SECRET_ACCESS_KEY: 'STACKMATE_SECRET_ACCESS_KEY',
  AWS_SESSION_TOKEN: 'STACKMATE_AWS_SESSION_TOKEN',
};

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

export const FORMAT: { [name: string]: string } = {
  JSON: 'json',
  RAW: 'raw',
  YML: 'yml',
} as const;

export const STORAGE: { [name: string]: string } = {
  FILE: 'file',
} as const;

// Service defaults
export const DEFAULT_IP = '10.0.0.0';
