import path from 'node:path';
import { omit } from 'lodash';

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
  SECRETS: 'secrets',
  VOLUME: 'volume',
} as const;

export const JSON_SCHEMA_PATH = path.resolve(__dirname, 'stackmate.schema.json');
export const PROFILES_PATH = path.resolve(__dirname, 'profiles');
export const CLOUD_PROVIDER = omit({ ...PROVIDER }, 'LOCAL');

// Service defaults
export const DEFAULT_PROFILE_NAME = 'default' as const;
export const DEFAULT_SERVICE_STORAGE = 30 as const;
export const DEFAULT_CLOUD_PROVIDER = PROVIDER.AWS;
