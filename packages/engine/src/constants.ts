import path from 'node:path';
import { omit } from 'lodash';

import { AWS_DEFAULT_REGION } from './providers/aws/constants';

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

export const JSON_SCHEMA_PATH = path.resolve('stackmate.schema.json');
export const CORE_SERVICE_TYPES = [SERVICE_TYPE.PROVIDER, SERVICE_TYPE.STATE, SERVICE_TYPE.VAULT];
export const STORAGE: { [name: string]: string } = { FILE: 'file' } as const;
export const CLOUD_PROVIDER = omit({ ...PROVIDER }, 'LOCAL');

// Service defaults
export const DEFAULT_IP = '10.0.0.0';
export const DEFAULT_PROFILE_NAME = 'default';
export const DEFAULT_STATE_SERVICE_NAME = 'stage-state';
export const DEFAULT_VAULT_SERVICE_NAME = 'stage-vault';
export const DEFAULT_SERVICE_STORAGE = 30;
export const DEFAULT_CLOUD_PROVIDER = PROVIDER.AWS;
export const DEFAULT_REGION: { [provider: string]: string } = {
  [PROVIDER.AWS]: AWS_DEFAULT_REGION,
};
