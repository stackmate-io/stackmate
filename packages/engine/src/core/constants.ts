import { ProviderChoice, RegionList } from 'types';

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

export const AWS_REGIONS: RegionList = {
  EU_CENTRAL_1: 'eu-central-1',
} as const;

export const REGION: { [name: string]: RegionList } = {
  [PROVIDER.AWS]: AWS_REGIONS,
} as const;
