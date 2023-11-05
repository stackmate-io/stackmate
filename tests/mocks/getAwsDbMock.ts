import { DEFAULT_PROFILE_NAME, PROVIDER, SERVICE_TYPE } from '@src/constants'
import { kebabCase, snakeCase } from 'lodash'
import { faker } from '@faker-js/faker'
import {
  RDS_DEFAULT_VERSIONS_PER_ENGINE,
  RDS_ENGINE_PER_SERVICE_TYPE,
  RDS_INSTANCE_SIZES,
} from '@aws/constants'
import type { ServiceTypeChoice } from '@services/types'

export const getAwsDbMock = (
  type = faker.helpers.arrayElement([
    SERVICE_TYPE.MYSQL,
    SERVICE_TYPE.MARIADB,
    SERVICE_TYPE.POSTGRESQL,
  ]),
) => {
  const engine = RDS_ENGINE_PER_SERVICE_TYPE[type]
  return {
    name: kebabCase(faker.lorem.words()),
    provider: PROVIDER.AWS,
    type: type as ServiceTypeChoice,
    region: 'eu-central-1',
    size: faker.helpers.arrayElement(RDS_INSTANCE_SIZES),
    version: RDS_DEFAULT_VERSIONS_PER_ENGINE[engine],
    database: snakeCase(faker.lorem.word()),
    engine,
    links: [],
    externalLinks: [],
    nodes: 1,
    storage: faker.number.int({ min: 10, max: 100000 }),
    port: 5432,
    profile: DEFAULT_PROFILE_NAME,
    overrides: {},
    monitoring: {
      emails: [faker.internet.email()],
      urls: [faker.internet.url()],
    },
  }
}
