import { DEFAULT_PROFILE_NAME, PROVIDER } from '@src/constants'
import { kebabCase, snakeCase } from 'lodash'
import { faker } from '@faker-js/faker'
import { RDS_DEFAULT_VERSIONS_PER_ENGINE } from '@aws/constants'
import type { AwsDbServiceType, RdsEngine } from '@aws/constants'
import type { AwsDatabaseAttributes } from '@aws/services/database'

export const getAwsDbConfigMock = <T extends AwsDbServiceType, E extends RdsEngine>(
  type: T,
  engine: E,
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
  nodes: faker.number.int({ min: 1, max: 10 }),
  storage: faker.number.int({ min: 10, max: 100000 }),
  port: faker.internet.port(),
  profile: DEFAULT_PROFILE_NAME,
  overrides: {},
  monitoring: {
    emails: [faker.internet.email()],
    urls: [faker.internet.url()],
  },
})
