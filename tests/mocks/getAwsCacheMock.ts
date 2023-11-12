import { DEFAULT_PROFILE_NAME, PROVIDER } from '@src/constants'
import { kebabCase } from 'lodash'
import { faker } from '@faker-js/faker'
import { ELASTICACHE_DEFAULT_VERSIONS_PER_ENGINE } from '@aws/constants'
import type { AwsCacheAttributes } from '@src/services/providers/aws/services/cache'
import type { AwsCacheServiceType, ElasticacheEngine } from '@aws/constants'

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
