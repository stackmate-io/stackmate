import { pipe } from 'lodash/fp'
import { getBaseService } from '@src/services/utils'
import { PROVIDER, SERVICE_TYPE } from '@src/constants'
import { withRegions, type RegionalAttributes } from '@src/services/behaviors'
import { REGIONS } from '@aws/constants'
import type { Stack } from '@src/lib/stack'
import type { ecsCluster } from '@cdktf/provider-aws'
import type { BaseServiceAttributes, Provisionable, Service } from '@src/services/types'
import type { AwsProviderAssociations } from '@aws/types'

export type AwsClusterAttributes = BaseServiceAttributes &
  RegionalAttributes & {
    provider: typeof PROVIDER.AWS
    type: typeof SERVICE_TYPE.CLUSTER
  }

export type AwsClusterResources = {
  cluster: ecsCluster.EcsCluster
}

export type AwsClusterService = Service<AwsClusterAttributes, AwsProviderAssociations>

export type AwsClusterProvisionable = Provisionable<AwsClusterService, AwsClusterResources>

export const resourceHandler = (
  provisionable: AwsClusterProvisionable,
  stack: Stack,
): AwsClusterResources => {}

const getClusterService = (): AwsClusterService =>
  pipe(withRegions(REGIONS))(getBaseService(PROVIDER.AWS, SERVICE_TYPE.CLUSTER))
