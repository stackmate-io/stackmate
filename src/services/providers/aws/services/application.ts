import { pipe } from 'lodash/fp'
import {
  albListener,
  cloudwatchLogGroup,
  ecsService,
  ecsTaskDefinition,
  route53Record,
  securityGroup,
} from '@cdktf/provider-aws'
import { PROVIDER, SERVICE_TYPE } from '@src/constants'
import { getBaseService } from '@src/services/utils'
import * as behaviors from '@src/services/behaviors'
import { getProviderAssociations } from '@aws/utils/getProviderAssociations'
import { getNetworkingAssociations } from '@aws/utils/getNetworkingAssociations'
import { getDomainMatcher, getTopLevelDomain } from '@src/lib/domain'
import { Fn } from 'cdktf'
import type {
  ecsCluster,
  iamRole,
  route53Zone,
  ecrRepository,
  acmCertificate,
  albTargetGroup,
  alb,
} from '@cdktf/provider-aws'
import type { TerraformOutput } from 'cdktf'
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
import type { AwsSSLAttributes, AwsSSLProvisionable, AwsSSLResources } from './ssl'

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
    domain?: string
    environment?: Record<string, string>
    web: boolean
    www: boolean
  }

export type AwsApplicationAttributes =
  | (AppAttributes & {
      preset: string
    })
  | (AppAttributes & { tasks: TasksBreakdown })

export type AwsApplicationRequirements = {
  dnsZone: ServiceRequirement<AwsDnsResources['zone'], typeof SERVICE_TYPE.DNS>
  cluster: ServiceRequirement<AwsClusterResources['cluster'], typeof SERVICE_TYPE.CLUSTER>
  repository: ServiceRequirement<AwsClusterResources['repository'], typeof SERVICE_TYPE.CLUSTER>
  certificate: ServiceRequirement<AwsSSLResources['certificate'], typeof SERVICE_TYPE.SSL>
  taskExecutionRole: ServiceRequirement<
    AwsClusterResources['taskExecutionRole'],
    typeof SERVICE_TYPE.CLUSTER
  >
  loadBalancer: ServiceRequirement<
    AwsLoadBalancerResources['loadBalancer'],
    typeof SERVICE_TYPE.LOAD_BALANCER
  >
  loadBalancerSecurityGroup: ServiceRequirement<
    AwsLoadBalancerResources['securityGroup'],
    typeof SERVICE_TYPE.LOAD_BALANCER
  >
  targetGroup: ServiceRequirement<
    AwsLoadBalancerResources['targetGroup'],
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
  repository: {
    with: SERVICE_TYPE.CLUSTER,
    requirement: true,
    where: (config: BaseServiceAttributes, linked: BaseServiceAttributes) =>
      config.provider === linked.provider && config.region === linked.region,
    handler: (prov: AwsClusterProvisionable): ecrRepository.EcrRepository =>
      prov.provisions.repository,
  },
  taskExecutionRole: {
    with: SERVICE_TYPE.CLUSTER,
    requirement: true,
    where: (config: BaseServiceAttributes, linked: BaseServiceAttributes) =>
      config.provider === linked.provider && config.region === linked.region,
    handler: (prov: AwsClusterProvisionable): iamRole.IamRole => prov.provisions.taskExecutionRole,
  },
  dnsZone: {
    with: SERVICE_TYPE.DNS,
    requirement: true,
    where: (source: AwsApplicationAttributes, linked: AwsDnsAttributes) =>
      source.provider === linked.provider &&
      Boolean(source.domain) &&
      getTopLevelDomain(source.domain as string) === getTopLevelDomain(linked.domain),
    handler: (prov: AwsDnsProvisionable): route53Zone.Route53Zone => prov.provisions.zone,
  },
  loadBalancer: {
    with: SERVICE_TYPE.LOAD_BALANCER,
    requirement: true,
    where: (source: AwsApplicationAttributes, linked: AwsLoadBalancerAttributes) =>
      Boolean(source.port) &&
      source.provider === linked.provider &&
      source.region === linked.region,
    handler: (prov: AwsLoadBalancerProvisionable): alb.Alb => prov.provisions.loadBalancer,
  },
  targetGroup: {
    with: SERVICE_TYPE.LOAD_BALANCER,
    requirement: true,
    where: (source: AwsApplicationAttributes, linked: AwsLoadBalancerAttributes) =>
      Boolean(source.port) &&
      source.provider === linked.provider &&
      source.region === linked.region,
    handler: (prov: AwsLoadBalancerProvisionable): albTargetGroup.AlbTargetGroup =>
      prov.provisions.targetGroup,
  },
  loadBalancerSecurityGroup: {
    with: SERVICE_TYPE.LOAD_BALANCER,
    requirement: true,
    where: (source: AwsApplicationAttributes, linked: AwsLoadBalancerAttributes) =>
      Boolean(source.port) &&
      source.provider === linked.provider &&
      source.region === linked.region,
    handler: (prov: AwsLoadBalancerProvisionable): securityGroup.SecurityGroup =>
      prov.provisions.securityGroup,
  },
  certificate: {
    with: SERVICE_TYPE.SSL,
    requirement: true,
    where: (source: AwsApplicationAttributes, linked: AwsSSLAttributes) =>
      source.provider === linked.provider && source.domain === linked.domain,
    handler: (prov: AwsSSLProvisionable): acmCertificate.AcmCertificate =>
      prov.provisions.certificate,
  },
})

export type AwsApplicationService = Service<
  AwsApplicationAttributes,
  AwsProviderAssociations & AwsNetworkingAssociations & AwsApplicationRequirements
>

export type AwsApplicationResources = {
  service: ecsService.EcsService
  taskDefinition: ecsTaskDefinition.EcsTaskDefinition
  listeners: albListener.AlbListener[]
  dnsRecords: route53Record.Route53Record[]
  outputs: TerraformOutput[]
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
    requirements: {
      vpc,
      dnsZone,
      repository,
      cluster,
      subnets,
      targetGroup,
      taskExecutionRole,
      loadBalancer,
      certificate,
      providerInstance,
      loadBalancerSecurityGroup,
    },
  } = provisionable

  const logGroup = new cloudwatchLogGroup.CloudwatchLogGroup(
    stack.context,
    `${resourceId}_log_group`,
    {
      name: config.name,
      provider: providerInstance,
    },
  )

  const containerDefinition = {
    name: config.name,
    // TODO
    image: `${repository.repositoryUrl}/${config.image}`,
    cpu: config.cpu,
    memory: config.memory,
    essential: true,
    privileged: false,
    networkMode: 'awsvpc',
    readonlyRootFilesystem: false,
    logConfiguration: {
      logDriver: 'awslogs',
      options: {
        'awslogs-group': logGroup.name,
        'awslogs-region': config.region,
        'awslogs-stream-prefix': config.name,
      },
    },
    ...(config.port ? { portMappings: [{ containerPort: config.port }] } : null),
  }

  const taskDefinition = new ecsTaskDefinition.EcsTaskDefinition(
    stack.context,
    `${resourceId}_task_definition`,
    {
      networkMode: 'awsvpc',
      provider: providerInstance,
      family: `${config.name}-service`,
      requiresCompatibilities: ['FARGATE'],
      cpu: String(config.cpu),
      memory: String(config.memory),
      executionRoleArn: taskExecutionRole.arn,
      // TODO
      // task_role_arn            = var.roleArn
      placementConstraints: [
        {
          type: 'memberOf',
          expression: `attribute:ecs.availability-zone in [${subnets
            .map((subnet) => subnet.availabilityZone)
            .join(', ')}]`,
        },
      ],
      containerDefinitions: Fn.jsonencode([containerDefinition]),
    },
  )

  let sg: securityGroup.SecurityGroup | undefined

  if (config.web) {
    sg = new securityGroup.SecurityGroup(stack.context, `${resourceId}_security_group`, {
      name: `${config.name}-security-group`,
      description: `Security group for the ${config.name} service`,
      vpcId: vpc.id,
      provider: providerInstance,
    })
  }

  const service = new ecsService.EcsService(stack.context, `${resourceId}_service`, {
    name: config.name,
    cluster: cluster.id,
    provider: providerInstance,
    taskDefinition: taskDefinition.arn,
    schedulingStrategy: 'REPLICA',
    desiredCount: config.nodes,
    forceNewDeployment: true,
    dependsOn: [targetGroup],
    networkConfiguration: {
      securityGroups: config.web && sg ? [loadBalancerSecurityGroup.id, sg.id] : [],
      subnets: subnets.map((subnet) => subnet.id),
      assignPublicIp: false,
    },
    loadBalancer: config.web
      ? [
          {
            targetGroupArn: targetGroup.arn,
            containerName: config.name,
            containerPort: config.port,
          },
        ]
      : undefined,
    lifecycle: {
      ignoreChanges: ['task_definition', 'load_balancer', 'desired_count'],
    },
  })

  const listeners: albListener.AlbListener[] = []
  const dnsRecords: route53Record.Route53Record[] = []

  if (config.web) {
    const opts = {
      loadBalancerArn: loadBalancer.arn,
      protocol: 'TCP',
      provider: providerInstance,
      dependsOn: [targetGroup],
      lifecycle: {
        ignoreChanges: ['default_action'],
      },
    }

    listeners.push(
      new albListener.AlbListener(stack.context, `${resourceId}_listener_http`, {
        ...opts,
        port: 80,
        defaultAction: [
          {
            type: 'redirect',
            redirect: { port: '443', protocol: 'HTTPS', statusCode: 'HTTP_301' },
          },
        ],
      }),
      new albListener.AlbListener(stack.context, `${resourceId}_listener_https`, {
        ...opts,
        port: 443,
        certificateArn: certificate.arn,
        defaultAction: [
          {
            targetGroupArn: targetGroup.arn,
            type: 'forward',
          },
        ],
      }),
    )

    if (config.domain) {
      const domain = config.domain.replace(/^www\.(.*)$/i, '$1')
      const isTld = domain === getTopLevelDomain(domain)
      dnsRecords.push(
        new route53Record.Route53Record(stack.context, `${resourceId}_dns_record`, {
          name: domain,
          zoneId: dnsZone.id,
          provider: providerInstance,
          ...(isTld
            ? {
                type: 'A',
                alias: {
                  name: loadBalancer.dnsName,
                  zoneId: dnsZone.id,
                  evaluateTargetHealth: true,
                },
              }
            : { type: 'CNAME', records: [loadBalancer.dnsName] }),
        }),
      )

      if (config.www) {
        dnsRecords.push(
          new route53Record.Route53Record(stack.context, `${resourceId}_dns_record_www`, {
            name: `www.${domain}`,
            zoneId: dnsZone.id,
            type: 'CNAME',
            records: [loadBalancer.dnsName],
            provider: providerInstance,
          }),
        )
      }
    }
  }

  // TODO:
  // Task Role
  const outputs: TerraformOutput[] = []

  return {
    service,
    listeners,
    dnsRecords,
    taskDefinition,
    outputs,
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
        domain: {
          type: 'string',
          pattern: String(getDomainMatcher()),
        },
        web: {
          type: 'boolean',
          default: true,
        },
        www: {
          type: 'boolean',
          default: true,
        },
      },
    }),
  )(getBaseService(PROVIDER.AWS, SERVICE_TYPE.APP))

export const AwsApplication = getApplicationService()
