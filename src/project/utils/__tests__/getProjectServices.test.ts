import { getAwsAppConfigMock, getAwsDbConfigMock } from '@tests/mocks/aws'
import { PROVIDER, SERVICE_TYPE } from '@src/constants'
import { getProjectMock } from '@tests/mocks/project'
import { getProjectServices } from '@src/project/utils/getProjectServices'
import { faker } from '@faker-js/faker'
import { ENVIRONMENT } from '@src/project/constants'
import type { ServiceConfiguration } from '@src/services/registry'

describe('getProjectServices', () => {
  const environment = ENVIRONMENT.PRODUCTION

  it('registers the aws provider and networking', () => {
    const dbConfig = getAwsDbConfigMock() as ServiceConfiguration
    const config = getProjectMock([dbConfig])
    const services = getProjectServices(config, environment)

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
    expect(services.every((srv) => srv.region === dbConfig.region))
  })

  it('allows explicit declarations of provider services', () => {
    const config = getProjectMock([
      {
        type: SERVICE_TYPE.PROVIDER,
        region: 'eu-central-1',
        name: 'aws-provider',
      },
      getAwsDbConfigMock() as ServiceConfiguration,
    ])

    const services = getProjectServices(config, environment)
    expect(services.filter((srv) => srv.type === SERVICE_TYPE.PROVIDER)).toHaveLength(1)
  })

  it('allows explicit declarations of networking services', () => {
    const config = getProjectMock([
      {
        type: SERVICE_TYPE.NETWORKING,
        region: 'eu-central-1',
        name: 'aws-networking',
      },
      getAwsDbConfigMock() as ServiceConfiguration,
    ])

    const services = getProjectServices(config, environment)
    expect(services.filter((srv) => srv.type === SERVICE_TYPE.NETWORKING)).toHaveLength(1)
  })

  it('allows explicit declarations of cluster services', () => {
    const config = getProjectMock([
      {
        type: SERVICE_TYPE.CLUSTER,
        region: 'eu-central-1',
        name: 'aws-cluster',
        clusterName: faker.internet.domainWord(),
      },
      getAwsAppConfigMock() as ServiceConfiguration,
      getAwsDbConfigMock() as ServiceConfiguration,
    ])

    const services = getProjectServices(config, environment)
    expect(services.filter((srv) => srv.type === SERVICE_TYPE.CLUSTER)).toHaveLength(1)
  })

  it('registers requirements automatically', () => {
    const config = getProjectMock([
      getAwsAppConfigMock() as ServiceConfiguration,
      getAwsDbConfigMock() as ServiceConfiguration,
    ])

    const services = getProjectServices(config, environment)
    expect(services.map((srv) => srv.type)).toEqual(
      expect.arrayContaining([
        SERVICE_TYPE.STATE,
        SERVICE_TYPE.PROVIDER,
        SERVICE_TYPE.NETWORKING,
        SERVICE_TYPE.CLUSTER,
        SERVICE_TYPE.DNS,
        SERVICE_TYPE.APP,
        SERVICE_TYPE.MYSQL,
      ]),
    )
  })
})
