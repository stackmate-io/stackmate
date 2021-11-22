import os from 'os';
import path from 'path';
import { RegionList } from '@stackmate/types';
import { AWS_REGIONS } from '@stackmate/clouds/aws/constants';

export const DEFAULT_PROJECT_FILE = path.join(process.cwd(), '.stackmate', 'config.yml');
export const OUTPUT_DIRECTORY = process.env.STACKMATE_OUTPUT || path.join(os.homedir(), '.stackmate');
export const SYNTH_COMMAND = 'stackmate version';

export const PROVIDER = {
  AWS: 'aws',
} as const;

export const SERVICE_TYPE = {
  INSTANCE: 'instance',
  CDN: 'cdn',
  MYSQL: 'mysql',
  REDIS: 'redis',
  MEMCACHED: 'memcached',
  POSTGRESQL: 'postgresql',
  MAILER: 'mailer',
  VOLUME: 'volume',
  SSL: 'ssl',
  DNS: 'dns',
  LOAD_BALANCER: 'loadbalancer',
  ELASTIC_STORAGE: 'elasticstorage',
  NETWORKING: 'networking',
} as const;

export const REGION: { [name: string]: RegionList } = {
  [PROVIDER.AWS]: AWS_REGIONS,
} as const;

export const FORMAT: { [name: string]: string } = {
  YML: 'yml',
  JSON: 'json',
  RAW: 'raw',
} as const;

export const STORAGE: { [name: string]: string } = {
  FILE: 'file',
  AWS: 'aws/ssm/parameter-store',
} as const;
