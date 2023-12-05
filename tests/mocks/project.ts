import path from 'node:path'
import { faker } from '@faker-js/faker/locale/af_ZA'
import { PROVIDER } from '@src/constants'
import { ENVIRONMENT } from '@src/project/constants'
import type { ProjectConfiguration } from '@src/project'

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
