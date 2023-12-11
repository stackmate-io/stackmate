import { pipe } from 'lodash/fp'
import { getBaseService } from '@src/services/utils'
import { PROVIDER, SERVICE_TYPE } from '@src/constants'
import {
  withRegions,
  type RegionalAttributes,
  withHandler,
  withAssociations,
  withSchema,
} from '@src/services/behaviors'
import { REGIONS } from '@aws/constants'
import {
  ecsCluster,
  cloudwatchLogGroup,
  iamRole,
  dataAwsIamPolicyDocument,
  ecrRepository,
} from '@cdktf/provider-aws'
import { getProviderAssociations } from '@aws/utils/getProviderAssociations'
import { camelCase, kebabCase } from 'lodash'
import { TerraformOutput } from 'cdktf'
import type { Stack } from '@src/lib/stack'
import type { BaseServiceAttributes, Provisionable, Service } from '@src/services/types'
import type { AwsProviderAssociations } from '@aws/types'

export type AwsClusterAttributes = BaseServiceAttributes &
  RegionalAttributes & {
    provider: typeof PROVIDER.AWS
    type: typeof SERVICE_TYPE.CLUSTER
    clusterName: string
  }

export type AwsClusterResources = {
  cluster: ecsCluster.EcsCluster
  logGroup: cloudwatchLogGroup.CloudwatchLogGroup
  taskExecutionRole: iamRole.IamRole
  repository: ecrRepository.EcrRepository
  outputs: TerraformOutput[]
}

export type AwsClusterService = Service<AwsClusterAttributes, AwsProviderAssociations>

export type AwsClusterProvisionable = Provisionable<AwsClusterService, AwsClusterResources>

export const resourceHandler = (
  provisionable: AwsClusterProvisionable,
  stack: Stack,
): AwsClusterResources => {
  const {
    config: { clusterName },
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
        logging: 'OVERRIDE',
        logConfiguration: {
          cloudWatchEncryptionEnabled: true,
          cloudWatchLogGroupName: logGroup.name,
        },
      },
    },
  })

  const repository = new ecrRepository.EcrRepository(stack.context, `${resourceId}_repository`, {
    name: kebabCase(clusterName),
    imageTagMutability: 'IMMUTABLE',
    provider: providerInstance,
    imageScanningConfiguration: {
      scanOnPush: true,
    },
    lifecycle: {
      createBeforeDestroy: true,
    },
  })

  const taskExecutionRoleAssumeRolePolicy = new dataAwsIamPolicyDocument.DataAwsIamPolicyDocument(
    stack.context,
    `${resourceId}_assume_role_policy`,
    {
      provider: providerInstance,
      statement: [
        {
          effect: 'Allow',
          actions: ['sts:AssumeRole'],
          principals: [
            {
              type: 'Service',
              identifiers: ['ecs-tasks.amazonaws.com'],
            },
          ],
        },
      ],
    },
  )

  const iamRolePolicyDocument = new dataAwsIamPolicyDocument.DataAwsIamPolicyDocument(
    stack.context,
    `${resourceId}_task_execution_role_policy`,
    {
      provider: providerInstance,
      statement: [
        {
          sid: 'CreateLogGroups',
          effect: 'Allow',
          actions: ['log:CreateLogGroup'],
          resources: ['*'],
        },
        {
          sid: 'PublishLogEvents',
          effect: 'Allow',
          actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
          resources: ['*'],
        },
        {
          sid: 'EcsExecution',
          effect: 'Allow',
          actions: [
            'ecr:GetAuthorizationToken',
            'ecr:BatchCheckLayerAvailability',
            'ecr:GetDownloadUrlForLayer',
            'ecr:BatchGetImage',
          ],
          resources: ['*'],
        },
      ],
    },
  )

  const taskExecutionRole = new iamRole.IamRole(
    stack.context,
    `${resourceId}_task_execution_role`,
    {
      provider: providerInstance,
      name: camelCase(`${clusterName}-task-execution-role`),
      assumeRolePolicy: taskExecutionRoleAssumeRolePolicy.json,
      inlinePolicy: [
        {
          name: camelCase(`${clusterName}-task-execution-policy`),
          policy: iamRolePolicyDocument.json,
        },
      ],
    },
  )

  const outputs = [
    new TerraformOutput(stack.context, `${resourceId}_ecr_repository_url`, {
      value: repository.repositoryUrl,
    }),
    new TerraformOutput(stack.context, `${resourceId}_task_executionRole_arn`, {
      value: taskExecutionRole.arn,
    }),
    new TerraformOutput(stack.context, `${resourceId}_cluster_log_group_arn`, {
      value: logGroup.arn,
    }),
    new TerraformOutput(stack.context, `${resourceId}_cluster_arn`, {
      value: cluster.arn,
    }),
  ]

  return {
    logGroup,
    cluster,
    repository,
    taskExecutionRole,
    outputs,
  }
}

const getClusterService = (): AwsClusterService =>
  pipe(
    withHandler(resourceHandler),
    withAssociations(getProviderAssociations()),
    withRegions(REGIONS),
    withSchema({
      type: 'object',
      required: ['clusterName'],
      properties: {
        clusterName: {
          type: 'string',
        },
      },
    }),
  )(getBaseService(PROVIDER.AWS, SERVICE_TYPE.CLUSTER))

export const AwsCluster = getClusterService()
