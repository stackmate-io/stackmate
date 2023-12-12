import path from 'node:path'
import { faker } from '@faker-js/faker/locale/af_ZA'
import { PROVIDER } from '@src/constants'
import { ENVIRONMENT } from '@src/project/constants'
import { fromPairs, kebabCase } from 'lodash'
import type { ServiceConfiguration } from '@src/services/registry'
import type { ProjectConfiguration } from '@src/project'

export const getProjectMock = (services: ServiceConfiguration[]): ProjectConfiguration => ({
  state: {
    bucket: kebabCase(faker.lorem.words()),
    lockTable: kebabCase(faker.lorem.words()),
    statePath: 'stackmate.tfstate',
  },
  environments: {
    [ENVIRONMENT.PRODUCTION]: fromPairs(services.map((config) => [config.name, config])),
  },
})

export const getAwsDatabaseProjectMock = (): ProjectConfiguration => ({
  name: faker.internet.domainWord(),
  state: {
    provider: PROVIDER.AWS,
    bucket: faker.internet.domainWord(),
    lockTable: faker.internet.domainWord(),
    statePath: path.join(faker.system.directoryPath(), `${faker.internet.domainWord()}.tfstate`),
  },
  environments: {
    [ENVIRONMENT.PRODUCTION]: {
      mysqlDb: {
        type: 'mysql',
      },
    },
  },
})

// TODO
export const getFullStackProject = (): ProjectConfiguration => {
  const project = getAwsDatabaseProjectMock()

  return {
    ...project,
    environments: {
      [ENVIRONMENT.PRODUCTION]: {
        ...project.environments.production,
      },
    },
  }
}
