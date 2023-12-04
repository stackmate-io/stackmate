import { ecrRepository } from '@cdktf/provider-aws'
import type { Stack } from '@src/lib/stack'
import type { PROVIDER, SERVICE_TYPE } from '@src/constants'
import type { BaseServiceAttributes, Provisionable, Service } from '@src/services/types'
import type { AwsNetworkingAssociations, AwsProviderAssociations } from '../types'

type TasksBreakdown = {
  tasks: {
    deployment: string[]
  }
}

type AppAttributes = BaseServiceAttributes & {
  provider: typeof PROVIDER.AWS
  type: typeof SERVICE_TYPE.APP
  cpu: number
  memory: number
  ports: number[]
  environment?: Record<string, string>
  repository?: string
}

export type AwsApplicationAttributes =
  | (AppAttributes & {
      preset: string
    })
  | (AppAttributes & { tasks: TasksBreakdown })

export type AwsApplicationService = Service<
  AwsApplicationAttributes,
  AwsProviderAssociations & AwsNetworkingAssociations
>

export type AwsApplicationResources = {
  registry: any
  loadBalancer: any
  service: any
  task: any
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
    requirements: { providerInstance },
  } = provisionable

  const repository = new ecrRepository.EcrRepository(stack.context, resourceId, {
    name: config.repository || config.name,
    imageTagMutability: 'IMMUTABLE',
    provider: providerInstance,
    lifecycle: {
      createBeforeDestroy: true,
    },
  })
}
