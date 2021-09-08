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
