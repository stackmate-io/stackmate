import { faker } from '@faker-js/faker'
import { PROVIDER, DEFAULT_PROFILE_NAME, SERVICE_TYPE } from '@src/constants'
import {
  ELASTICACHE_DEFAULT_VERSIONS_PER_ENGINE,
  RDS_DEFAULT_VERSIONS_PER_ENGINE,
  RDS_ENGINE_PER_SERVICE_TYPE,
} from '@src/services/providers/aws/constants'
import { kebabCase, snakeCase } from 'lodash'
import type { AwsApplicationAttributes } from '@src/services/providers/aws/services/application'
import type { AwsDatabaseAttributes } from '@src/services/providers/aws/services/database'
import type {
  AwsCacheServiceType,
  AwsDbServiceType,
  ElasticacheEngine,
  RdsEngine,
} from '@src/services/providers/aws/types'
import type { AwsCacheAttributes } from '@src/services/providers/aws/services/cache'

export const getAwsCacheConfigMock = <T extends AwsCacheServiceType, E extends ElasticacheEngine>(
  type: T,
  engine: E,
  cluster: boolean,
): AwsCacheAttributes<typeof type, typeof engine> => ({
  name: kebabCase(faker.lorem.words()),
  provider: PROVIDER.AWS,
  type,
  region: 'eu-central-1',
  size: faker.helpers.arrayElement([
    'cache.t4g.medium',
    'cache.t3.micro',
    'cache.m7g.large',
    'cache.m6g.2xlarge',
    'cache.m5.xlarge',
  ]),
  version: ELASTICACHE_DEFAULT_VERSIONS_PER_ENGINE[engine],
  engine,
  links: [],
  externalLinks: [],
  nodes: cluster ? faker.number.int({ min: 1, max: 10 }) : 1,
  port: faker.internet.port(),
  profile: DEFAULT_PROFILE_NAME,
  overrides: {},
  cluster,
  monitoring: {
    emails: [faker.internet.email()],
    urls: [faker.internet.url()],
  },
})

const getRandomDbType = (): AwsDbServiceType => faker.helpers.arrayElement([SERVICE_TYPE.MYSQL])
const getDbEngine = (type: AwsDbServiceType): RdsEngine => RDS_ENGINE_PER_SERVICE_TYPE[type]

export const getAwsDbConfigMock = (
  type: AwsDbServiceType = getRandomDbType(),
  engine: RdsEngine = getDbEngine(type),
): AwsDatabaseAttributes<typeof type, typeof engine> => ({
  name: kebabCase(faker.lorem.words()),
  provider: PROVIDER.AWS,
  type,
  region: 'eu-central-1',
  size: faker.helpers.arrayElement([
    'db.t2.xlarge',
    'db.t2.2xlarge',
    'db.m4.large',
    'db.m4.xlarge',
    'db.m5.24xlarge',
  ]),
  version: RDS_DEFAULT_VERSIONS_PER_ENGINE[engine],
  database: snakeCase(faker.lorem.word()),
  engine,
  links: [],
  externalLinks: [],
  storage: faker.number.int({ min: 10, max: 100000 }),
  port: faker.internet.port(),
  profile: DEFAULT_PROFILE_NAME,
  overrides: {},
  monitoring: {
    emails: [faker.internet.email()],
    urls: [faker.internet.url()],
  },
})

export const getAwsAppConfigMock = (): AwsApplicationAttributes => ({
  name: kebabCase(faker.lorem.words()),
  provider: PROVIDER.AWS,
  type: SERVICE_TYPE.APP,
  region: 'eu-central-1',
  cpu: faker.helpers.arrayElement([0.25, 0.5, 1]),
  memory: 2, // 2 is within the required range for given cpu configurations
  image: `${faker.lorem.word()}/${faker.lorem.word()}:latest`,
  nodes: 1,
  www: true,
  domain: faker.internet.domainName(),
  monitoring: {
    emails: [faker.internet.email()],
    urls: [faker.internet.url()],
  },
})
