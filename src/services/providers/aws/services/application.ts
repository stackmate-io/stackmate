import { pipe } from 'lodash/fp'
import { ecrRepository, ecsService, ecsTaskDefinition } from '@cdktf/provider-aws'
import { PROVIDER, SERVICE_TYPE } from '@src/constants'
import { getBaseService } from '@src/services/utils'
import * as behaviors from '@src/services/behaviors'
import { getProviderAssociations } from '@aws/utils/getProviderAssociations'
import { getNetworkingAssociations } from '@aws/utils/getNetworkingAssociations'
import { getTopLevelDomain } from '@src/lib/domain'
import type { alb, ecsCluster, route53Zone } from '@cdktf/provider-aws'
import type { Stack } from '@src/lib/stack'
import type {
  BaseServiceAttributes,
  Provisionable,
  Service,
  ServiceRequirement,
} from '@src/services/types'
import type { AwsNetworkingAssociations, AwsProviderAssociations } from '@aws/types'
import type { AwsClusterProvisionable, AwsClusterResources } from './cluster'
import type {
  AwsLoadBalancerAttributes,
  AwsLoadBalancerProvisionable,
  AwsLoadBalancerResources,
} from './loadbalancer'
import type { AwsDnsAttributes, AwsDnsProvisionable, AwsDnsResources } from './dns'

type TasksBreakdown = {
  tasks: {
    deployment: string[]
  }
}

type AppAttributes = BaseServiceAttributes &
  behaviors.MultiNodeAttributes &
  behaviors.ConnectableAttributes & {
    provider: typeof PROVIDER.AWS
    type: typeof SERVICE_TYPE.APP
    cpu: number
    memory: number
    domain: string
    environment?: Record<string, string>
    repository?: string
  }

export type AwsApplicationAttributes =
  | (AppAttributes & {
      preset: string
    })
  | (AppAttributes & { tasks: TasksBreakdown })

export type AwsApplicationRequirements = {
  cluster: ServiceRequirement<AwsClusterResources['cluster'], typeof SERVICE_TYPE.CLUSTER>
  dnsZone: ServiceRequirement<AwsDnsResources['zone'], typeof SERVICE_TYPE.DNS>
  loadBalancer: ServiceRequirement<
    AwsLoadBalancerResources['loadBalancer'],
    typeof SERVICE_TYPE.LOAD_BALANCER
  >
}

export const getApplicationRequirements = (): AwsApplicationRequirements => ({
  cluster: {
    with: SERVICE_TYPE.CLUSTER,
    requirement: true,
    where: (config: BaseServiceAttributes, linked: BaseServiceAttributes) =>
      config.provider === linked.provider && config.region === linked.region,
    handler: (prov: AwsClusterProvisionable): ecsCluster.EcsCluster => prov.provisions.cluster,
  },
  dnsZone: {
    with: SERVICE_TYPE.DNS,
    requirement: true,
    where: (source: AwsApplicationAttributes, linked: AwsDnsAttributes) =>
      source.provider === linked.provider &&
      getTopLevelDomain(source.domain) === getTopLevelDomain(linked.domain),
    handler: (prov: AwsDnsProvisionable): route53Zone.Route53Zone => prov.provisions.zone,
  },
  loadBalancer: {
    with: SERVICE_TYPE.LOAD_BALANCER,
    requirement: true,
    where: (source: AwsApplicationAttributes, linked: AwsLoadBalancerAttributes) =>
      source.provider === linked.provider && source.region === linked.region,
    handler: (prov: AwsLoadBalancerProvisionable): alb.Alb => prov.provisions.loadBalancer,
  },
})

export type AwsApplicationService = Service<
  AwsApplicationAttributes,
  AwsProviderAssociations & AwsNetworkingAssociations & AwsApplicationRequirements
>

export type AwsApplicationResources = {
  repository: ecrRepository.EcrRepository
  service: ecsService.EcsService
  taskDefinition: any
  autoScaling: any
}

export type AwsApplicationProvisionable = Provisionable<
  AwsApplicationService,
  AwsApplicationResources
>

export const resourceHandler = (
  provisionable: AwsApplicationProvisionable,
  stack: Stack,
): AwsApplicationResources => {
  const {
    config,
    resourceId,
    requirements: { providerInstance, cluster, subnets, loadBalancer },
  } = provisionable

  const repository = new ecrRepository.EcrRepository(stack.context, `${resourceId}_repository`, {
    name: config.repository || config.name,
    imageTagMutability: 'IMMUTABLE',
    provider: providerInstance,
    lifecycle: {
      createBeforeDestroy: true,
    },
  })

  const taskDefinition = new ecsTaskDefinition.EcsTaskDefinition(
    stack.context,
    `${resourceId}_task_definition`,
    {
      networkMode: 'awsvpc',
      family: `${config.name}-service`,
      requiresCompatibilities: ['FARGATE'],
      cpu: String(config.cpu),
      memory: String(config.memory),
      placementConstraints: [
        {
          type: 'memberOf',
          expression: `attribute:ecs.availability-zone in [${subnets
            .map((subnet) => subnet.availabilityZone)
            .join(', ')}]`,
        },
      ],
      containerDefinitions: [],
      // execution_role_arn       = var.roleExecArn
      // task_role_arn            = var.roleArn
    },
  )

  const service = new ecsService.EcsService(stack.context, `${resourceId}_service`, {
    name: config.name,
    cluster: cluster.id,
    taskDefinition: taskDefinition.arn,
    schedulingStrategy: 'REPLICA',
    desiredCount: config.nodes,
    forceNewDeployment: true,
    dependsOn: [loadBalancer],
    networkConfiguration: {
      subnets: subnets.map((subnet) => subnet.id),
      assignPublicIp: false,
    },
    loadBalancer: config.port
      ? [
          {
            targetGroupArn: loadBalancer.arn,
            containerName: config.name,
            containerPort: config.port,
          },
        ]
      : undefined,
    lifecycle: {
      ignoreChanges: ['task_definition', 'load_balancer', 'desired_count'],
    },
  })

  return {
    repository,
    service,
    taskDefinition: null,
    autoScaling: null,
  }
}

const getApplicationService = (): AwsApplicationService =>
  pipe(
    behaviors.withHandler(resourceHandler),
    behaviors.withAssociations(getProviderAssociations()),
    behaviors.withAssociations(getNetworkingAssociations()),
    behaviors.withAssociations(getApplicationRequirements()),
    behaviors.multiNode(),
    behaviors.connectable(),
    behaviors.withSchema({
      type: 'object',
      properties: {
        cpu: {
          type: 'number',
        },
        memory: {
          type: 'number',
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

export const AwsApplication = getApplicationService()
