import { pipe } from 'lodash/fp'
import { ecrRepository, ecsService } from '@cdktf/provider-aws'
import { PROVIDER, SERVICE_TYPE } from '@src/constants'
import { getBaseService } from '@src/services/utils'
import * as behaviors from '@src/services/behaviors'
import { getProviderAssociations } from '@aws/utils/getProviderAssociations'
import { getNetworkingAssociations } from '@aws/utils/getNetworkingAssociations'
import type { ecsCluster } from '@cdktf/provider-aws'
import type { Stack } from '@src/lib/stack'
import type {
  BaseServiceAttributes,
  Provisionable,
  Service,
  ServiceRequirement,
} from '@src/services/types'
import type { AwsNetworkingAssociations, AwsProviderAssociations } from '@aws/types'
import type { AwsClusterProvisionable, AwsClusterResources } from './cluster'

type TasksBreakdown = {
  tasks: {
    deployment: string[]
  }
}

type AppAttributes = BaseServiceAttributes &
  behaviors.MultiNodeAttributes & {
    provider: typeof PROVIDER.AWS
    type: typeof SERVICE_TYPE.APP
    cpu: number
    memory: number
    ports: number[]
    environment?: Record<string, string>
    repository?: string
  }

type AwsClusterAssociations = {
  cluster: ServiceRequirement<AwsClusterResources['cluster'], typeof SERVICE_TYPE.CLUSTER>
}

export type AwsApplicationAttributes =
  | (AppAttributes & {
      preset: string
    })
  | (AppAttributes & { tasks: TasksBreakdown })

export type AwsApplicationService = Service<
  AwsApplicationAttributes,
  AwsProviderAssociations & AwsNetworkingAssociations & AwsClusterAssociations
>

export type AwsApplicationResources = {
  repository: ecrRepository.EcrRepository
  service: ecsService.EcsService
  task: any
  taskDefinition: any
  loadBalancer: any
  autoScaling: any
}

export type AwsApplicationProvisionable = Provisionable<
  AwsApplicationService,
  AwsApplicationResources
>

const clusterAssociations: AwsClusterAssociations = {
  cluster: {
    with: SERVICE_TYPE.CLUSTER,
    requirement: true,
    where: (config: BaseServiceAttributes, linked: BaseServiceAttributes) =>
      config.provider === linked.provider && config.region === linked.region,
    handler: (prov: AwsClusterProvisionable): ecsCluster.EcsCluster => prov.provisions.cluster,
  },
}
export const resourceHandler = (
  provisionable: AwsApplicationProvisionable,
  stack: Stack,
): AwsApplicationResources => {
  const {
    config,
    resourceId,
    requirements: { providerInstance, cluster },
  } = provisionable

  const repository = new ecrRepository.EcrRepository(stack.context, `${resourceId}_repository`, {
    name: config.repository || config.name,
    imageTagMutability: 'IMMUTABLE',
    provider: providerInstance,
    lifecycle: {
      createBeforeDestroy: true,
    },
  })

  const service = new ecsService.EcsService(stack.context, `${resourceId}_service`, {
    name: config.name,
    cluster: cluster.id,
  })

  return {
    repository,
    service,
    task: null,
    taskDefinition: null,
    loadBalancer: null,
    autoScaling: null,
  }
}

const getApplicationService = (): AwsApplicationService =>
  pipe(
    behaviors.withHandler(resourceHandler),
    behaviors.withAssociations(getProviderAssociations()),
    behaviors.withAssociations(getNetworkingAssociations()),
    behaviors.withAssociations(clusterAssociations),
    behaviors.multiNode(),
    behaviors.withSchema({
      type: 'object',
      properties: {
        cpu: {
          type: 'number',
        },
        memory: {
          type: 'number',
        },
        ports: {
          type: 'array',
          items: {
            type: 'number',
          },
          default: [80, 443],
        },
        environment: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
        repository: {
          type: 'string',
        },
      },
    }),
  )(getBaseService(PROVIDER.AWS, SERVICE_TYPE.APP))

export const AwsApplicationService = getApplicationService()
