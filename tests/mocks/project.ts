import { faker } from '@faker-js/faker/locale/af_ZA'
import { SERVICE_TYPE } from '@src/constants'
import { ENVIRONMENT } from '@src/project/constants'
import { fromPairs, kebabCase } from 'lodash'
import type { ServiceConfiguration } from '@src/services/registry'
import type { EnvironmentChoice, ProjectConfiguration } from '@src/project'

export const getProjectMock = (
  services: Partial<ServiceConfiguration>[],
  environment: EnvironmentChoice = ENVIRONMENT.PRODUCTION,
): ProjectConfiguration => ({
  name: faker.internet.domainWord(),
  state: {
    bucket: kebabCase(faker.lorem.words()),
    lockTable: kebabCase(faker.lorem.words()),
    statePath: `${faker.internet.domainWord()}.tfstate`,
  },
  environments: {
    [environment]: fromPairs(services.map((config) => [config.name, config])),
  },
})

export const getAwsDatabaseProjectMock = (): ProjectConfiguration =>
  getProjectMock([{ type: SERVICE_TYPE.MYSQL, name: 'mysqlDb' }])

export const getFullStackProjectMock = (): ProjectConfiguration =>
  getProjectMock([
    { type: SERVICE_TYPE.MYSQL, name: 'mysqlDb' },
    {
      type: SERVICE_TYPE.APP,
      name: 'app',
      image: 'stackmate/sample-nodejs-app:latest',
      cpu: 0.25,
      memory: 1,
      port: 3000,
      domain: 'test.stackmate.io',
    },
  ])
