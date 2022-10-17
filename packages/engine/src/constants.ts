import os from 'node:os';
import path from 'node:path';
import { omit } from 'lodash';
import { ServiceTypeChoice } from './core/service';

export const { env: ENV } = process;
export const STACKMATE_DIRECTORY = '.stackmate';
export const DEFAULT_PROJECT_NAME = 'stackmate-project';
export const DEFAULT_RESOURCE_COMMENT = 'Deployed by Stackmate';
export const USER_HOME_DIRECTORY = path.join(os.homedir(), STACKMATE_DIRECTORY);
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

// Json Schema
export const JSON_SCHEMA_PATH = path.resolve(__dirname, 'stackmate.schema.json');
export const JSON_SCHEMA_ROOT = 'StackmateProject';
export const JSON_SCHEMA_KEY = 'stackmate-json-schema';

export const PROFILES_PATH = path.resolve(__dirname, 'profiles');
export const CLOUD_PROVIDER = omit({ ...PROVIDER }, 'LOCAL');

// Service defaults
export const DEFAULT_PROFILE_NAME = 'default' as const;
export const DEFAULT_SERVICE_STORAGE = 30 as const;
export const DEFAULT_CLOUD_PROVIDER = PROVIDER.AWS;
export const DEFAULT_PASSWORD_LENGTH = 16 as const;

export const DEFAULT_PORT: Map<ServiceTypeChoice, number> = new Map([
  [SERVICE_TYPE.MEMCACHED, 11211],
  [SERVICE_TYPE.MARIADB, 3306],
  [SERVICE_TYPE.MYSQL, 3306],
  [SERVICE_TYPE.POSTGRESQL, 5432],
  [SERVICE_TYPE.REDIS, 6379],
]);

export const PROFILE_DIRECTORY_OVERRIDES: Map<ServiceTypeChoice, string> = new Map([
  [SERVICE_TYPE.MEMCACHED, 'cache'],
  [SERVICE_TYPE.REDIS, 'cache'],
  [SERVICE_TYPE.MARIADB, 'database'],
  [SERVICE_TYPE.MYSQL, 'database'],
  [SERVICE_TYPE.POSTGRESQL, 'database'],
]);
