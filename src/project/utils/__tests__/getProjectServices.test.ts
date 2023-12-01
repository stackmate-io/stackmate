import { faker } from '@faker-js/faker/locale/af_ZA'
import { getAwsDbConfigMock } from '@tests/mocks/aws'
import { PROVIDER, SERVICE_TYPE } from '@src/constants'
import type { ProjectConfiguration } from '@src/project/types'
import { getProjectServices } from '../getProjectServices'

describe('getProjectServices', () => {
  it('registers the aws provider and networking', () => {
    const config: ProjectConfiguration = {
      state: {
        bucket: faker.internet.domainWord(),
        lockTable: faker.internet.domainWord(),
        statePath: `${faker.internet.domainWord()}.tfstate`,
      },
      environments: {
        production: {
          mysql: getAwsDbConfigMock(),
        },
      },
    }

    const services = getProjectServices(config, 'production')

    // Service count: state + mysql + provider + networking = 4
    expect(services).toHaveLength(4)
    expect(services.map((srv) => srv.type)).toEqual(
      expect.arrayContaining([
        SERVICE_TYPE.STATE,
        SERVICE_TYPE.MYSQL,
        SERVICE_TYPE.PROVIDER,
        SERVICE_TYPE.NETWORKING,
      ]),
    )
    expect(services.every((srv) => srv.provider === PROVIDER.AWS)).toBe(true)
    expect(config.environments.production?.mysql.region).not.toBeUndefined()
    expect(services.every((srv) => srv.region === config.environments.production?.mysql.region))
  })
})
