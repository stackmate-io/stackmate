import os from 'os';
import path from 'path';
import { RegionList } from '@stackmate/types';
import { AWS_REGIONS } from '@stackmate/providers/aws/constants';

export const { env: ENV } = process;
export const ENVIRONMENT_VARIABLE = {
  OUTPUT_DIR: 'STACKMATE_OUTPUT',
  AWS_ACCESS_KEY_ID: 'STACKMATE_AWS_ACCESS_KEY_ID',
  AWS_SECRET_ACCESS_KEY: 'STACKMATE_SECRET_ACCESS_KEY',
  AWS_SESSION_TOKEN: 'STACKMATE_AWS_SESSION_TOKEN',
};

export const STACKMATE_DIRECTORY = '.stackmate';
export const DEFAULT_PROJECT_FILE = path.join(process.cwd(), STACKMATE_DIRECTORY, 'config.yml');
export const DEFAULT_STAGE = 'production';
export const DEFAULT_RESOURCE_COMMENT = 'Deployed by Stackmate';
export const DEBUG_MODE = Boolean(ENV.DEBUG) || false;
export const DEFAULT_OUTPUT_PATH = path.join(os.homedir(), STACKMATE_DIRECTORY, 'projects');

export const PROVIDER = {
  AWS: 'aws',
  LOCAL: 'local',
} as const;

export const SERVICE_TYPE = {
  CDN: 'cdn',
  DATABASE: 'database',
  DNS: 'dns',
  ELASTIC_STORAGE: 'elasticstorage',
  INSTANCE: 'instance',
  LOAD_BALANCER: 'loadbalancer',
  MEMCACHED: 'memcached',
  MAILER: 'mailer',
  PROVIDER: 'provider',
  REDIS: 'redis',
  SSL: 'ssl',
  STATE: 'state',
  VAULT: 'vault',
  VOLUME: 'volume',
} as const;

export const REGION: { [name: string]: RegionList } = {
  [PROVIDER.AWS]: AWS_REGIONS,
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
