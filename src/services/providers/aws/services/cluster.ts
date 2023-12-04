import { pipe } from 'lodash/fp'
import { getBaseService } from '@src/services/utils'
import { PROVIDER, SERVICE_TYPE } from '@src/constants'
import {
  withRegions,
  type RegionalAttributes,
  withHandler,
  withAssociations,
} from '@src/services/behaviors'
import { REGIONS } from '@aws/constants'
import { ecsCluster, cloudwatchLogGroup } from '@cdktf/provider-aws'
import { getProviderAssociations } from '@aws/utils/getProviderAssociations'
import type { Stack } from '@src/lib/stack'
import type { BaseServiceAttributes, Provisionable, Service } from '@src/services/types'
import type { AwsProviderAssociations } from '@aws/types'

export type AwsClusterAttributes = BaseServiceAttributes &
  RegionalAttributes & {
    provider: typeof PROVIDER.AWS
    type: typeof SERVICE_TYPE.CLUSTER
  }

export type AwsClusterResources = {
  cluster: ecsCluster.EcsCluster
  logGroup: cloudwatchLogGroup.CloudwatchLogGroup
}

export type AwsClusterService = Service<AwsClusterAttributes, AwsProviderAssociations>

export type AwsClusterProvisionable = Provisionable<AwsClusterService, AwsClusterResources>

export const resourceHandler = (
  provisionable: AwsClusterProvisionable,
  stack: Stack,
): AwsClusterResources => {
  const {
    config: { name: clusterName },
    requirements: { providerInstance, kmsKey },
    resourceId,
  } = provisionable
  const logGroup = new cloudwatchLogGroup.CloudwatchLogGroup(stack.context, `${resourceId}_logs`, {
    name: `${clusterName}-logs`,
  })

  const cluster = new ecsCluster.EcsCluster(stack.context, resourceId, {
    name: clusterName,
    provider: providerInstance,
    setting: [
      {
        name: 'containerInsights',
        value: 'enabled',
      },
    ],
    configuration: {
      executeCommandConfiguration: {
        kmsKeyId: kmsKey.id,
        logging: 'override',
        logConfiguration: {
          cloudWatchEncryptionEnabled: true,
          cloudWatchLogGroupName: logGroup.name,
        },
      },
    },
  })

  return {
    logGroup,
    cluster,
  }
}

const getClusterService = (): AwsClusterService =>
  pipe(
    withHandler(resourceHandler),
    withAssociations(getProviderAssociations()),
    withRegions(REGIONS),
  )(getBaseService(PROVIDER.AWS, SERVICE_TYPE.CLUSTER))

export const AwsCluster = getClusterService()
