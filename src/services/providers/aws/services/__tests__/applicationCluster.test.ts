import { AwsCluster } from '@aws/services/applicationCluster'
import { PROVIDER, SERVICE_TYPE } from '@src/constants'
import { Registry } from '@src/services/registry'
import { faker } from '@faker-js/faker'
import { getSynthesizedStack } from '@tests/helpers/getSynthesizedStack'
import { REGIONS } from '@aws/constants'
import {
  cloudwatchLogGroup,
  dataAwsIamPolicyDocument,
  ecrRepository,
  ecsCluster,
  iamRole,
} from '@cdktf/provider-aws'
import { kebabCase } from 'lodash'
import type { AwsClusterAttributes } from '@aws/services/applicationCluster'

describe('Application Cluster Service', () => {
  const service = AwsCluster

  it('is a valid AWS App Cluster service', () => {
    expect(service.provider).toEqual(PROVIDER.AWS)
    expect(service.type).toEqual(SERVICE_TYPE.CLUSTER)
  })

  it('is fetched by the registry', () => {
    expect(Registry.get(PROVIDER.AWS, SERVICE_TYPE.CLUSTER))
  })

  it('has the AWS regions set', () => {
    expect(new Set(service.regions)).toEqual(new Set(REGIONS))
  })

  it('registers the resources in the stack', () => {
    const config: AwsClusterAttributes = {
      clusterName: 'my-ecs-cluster',
      name: faker.internet.domainWord(),
      provider: PROVIDER.AWS,
      region: 'eu-central-1',
      type: SERVICE_TYPE.CLUSTER,
    }

    const stack = getSynthesizedStack([config])

    expect(stack).toHaveResourceWithProperties(cloudwatchLogGroup.CloudwatchLogGroup, {
      name: `${config.clusterName}-logs`,
    })

    expect(stack).toHaveResourceWithProperties(ecsCluster.EcsCluster, {
      name: config.clusterName,
      setting: [
        {
          name: 'containerInsights',
          value: 'enabled',
        },
      ],
    })

    expect(stack).toHaveResource(iamRole.IamRole)
    expect(stack).toHaveDataSource(dataAwsIamPolicyDocument.DataAwsIamPolicyDocument)

    expect(stack).toHaveResourceWithProperties(ecrRepository.EcrRepository, {
      name: kebabCase(config.clusterName),
      image_tag_mutability: 'IMMUTABLE',
      image_scanning_configuration: {
        scan_on_push: true,
      },
      lifecycle: {
        create_before_destroy: true,
      },
    })
  })
})
