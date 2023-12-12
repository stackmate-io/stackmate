import { pipe } from 'lodash/fp'
import {
  albListener,
  ecsService,
  ecsTaskDefinition,
  route53Record,
  securityGroup,
  albTargetGroup,
} from '@cdktf/provider-aws'
import { PROVIDER, SERVICE_TYPE } from '@src/constants'
import { getBaseService } from '@src/services/utils'
import * as behaviors from '@src/services/behaviors'
import { getProviderAssociations } from '@aws/utils/getProviderAssociations'
import { getNetworkingAssociations } from '@aws/utils/getNetworkingAssociations'
import { getDomainMatcher, getTopLevelDomain, isTopLevelDomain } from '@src/lib/domain'
import { Fn, TerraformOutput } from 'cdktf'
import { hashString } from '@src/lib/hash'
import { awsApplicationServiceAlarms } from '@aws/alerts/application'
import { withAwsAlerts } from '@aws/utils/withAlerts'
import { REGIONS } from '@aws/constants'
import type {
  ecsCluster,
  iamRole,
  route53Zone,
  ecrRepository,
  alb,
  cloudwatchLogGroup,
  acmCertificate,
} from '@cdktf/provider-aws'
import type { OptionalKeys } from '@src/lib/util'
import type { Stack } from '@src/lib/stack'
import type {
  BaseServiceAttributes,
  Provisionable,
  Service,
  ServiceRequirement,
} from '@src/services/types'
import type { AwsNetworkingAssociations, AwsProviderAssociations } from '@aws/types'
import type { AwsClusterProvisionable, AwsClusterResources } from './applicationCluster'
import type {
  AwsLoadBalancerAttributes,
  AwsLoadBalancerProvisionable,
  AwsLoadBalancerResources,
} from './loadbalancer'
import type { AwsDnsAttributes, AwsDnsProvisionable, AwsDnsResources } from './dns'
import type { AwsSSLAttributes, AwsSSLProvisionable, AwsSSLResources } from './ssl'

export type AwsApplicationAttributes = BaseServiceAttributes &
  behaviors.MultiNodeAttributes &
  behaviors.MonitoringAttributes &
  behaviors.RegionalAttributes &
  OptionalKeys<behaviors.ConnectableAttributes, 'port'> & {
    provider: typeof PROVIDER.AWS
    type: typeof SERVICE_TYPE.APP
    cpu: number
    image: string
    memory: number
    domain?: string
    environment?: Record<string, string>
    www: boolean
  }

export type AwsApplicationRequirements = {
  dnsZone: ServiceRequirement<AwsDnsResources['zone'], typeof SERVICE_TYPE.DNS>
  cluster: ServiceRequirement<AwsClusterResources['cluster'], typeof SERVICE_TYPE.CLUSTER>
  repository: ServiceRequirement<AwsClusterResources['repository'], typeof SERVICE_TYPE.CLUSTER>
  certificate: ServiceRequirement<AwsSSLResources['certificate'], typeof SERVICE_TYPE.SSL>
  logGroup: ServiceRequirement<AwsClusterResources['logGroup'], typeof SERVICE_TYPE.CLUSTER>
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
}

export const getApplicationRequirements = (): AwsApplicationRequirements => ({
  cluster: {
    with: SERVICE_TYPE.CLUSTER,
    requirement: true,
    where: (config: BaseServiceAttributes, linked: BaseServiceAttributes) =>
      config.provider === linked.provider && config.region === linked.region,
    handler: (prov: AwsClusterProvisionable): ecsCluster.EcsCluster => prov.provisions.cluster,
  },
  logGroup: {
    with: SERVICE_TYPE.CLUSTER,
    requirement: true,
    where: (config: BaseServiceAttributes, linked: BaseServiceAttributes) =>
      config.provider === linked.provider && config.region === linked.region,
    handler: (prov: AwsClusterProvisionable): cloudwatchLogGroup.CloudwatchLogGroup =>
      prov.provisions.logGroup,
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

const deployApplication = (
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
      publicSubnets,
      logGroup,
      taskExecutionRole,
      loadBalancer,
      certificate,
      providerInstance,
      loadBalancerSecurityGroup,
    },
  } = provisionable

  const containerDefinition = {
    name: config.name,
    image: config.image ? config.image : `${repository.repositoryUrl}/${config.name}:latest`,
    cpu: config.cpu * 1024,
    memory: config.memory * 1024,
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
      family: config.name,
      requiresCompatibilities: ['FARGATE'],
      cpu: String(config.cpu * 1024),
      memory: String(config.memory * 1024),
      executionRoleArn: taskExecutionRole.arn,
      containerDefinitions: Fn.jsonencode([containerDefinition]),
    },
  )

  const serviceDependencies = []
  const listeners: albListener.AlbListener[] = []
  const dnsRecords: route53Record.Route53Record[] = []
  const securityGroups: string[] = [vpc.defaultSecurityGroupId]
  let targetGroup: albTargetGroup.AlbTargetGroup | undefined

  if (config.port) {
    securityGroups.push(loadBalancerSecurityGroup.id)

    targetGroup = new albTargetGroup.AlbTargetGroup(stack.context, `${resourceId}_target_group`, {
      name: `alb-tg-${hashString(config.name).slice(0, 12)}`,
      port: config.port,
      protocol: 'HTTP',
      targetType: 'ip',
      vpcId: vpc.id,
      provider: providerInstance,
      dependsOn: [loadBalancer],
      healthCheck: {
        enabled: true,
        healthyThreshold: 5,
        interval: 30,
        timeout: 10,
        path: '/',
        protocol: 'HTTP',
        unhealthyThreshold: 3,
      },
    })

    listeners.push(
      new albListener.AlbListener(stack.context, `${resourceId}_listener_http`, {
        loadBalancerArn: loadBalancer.arn,
        provider: providerInstance,
        dependsOn: [targetGroup],
        port: 80,
        protocol: 'HTTP',
        defaultAction: [
          {
            type: 'redirect',
            redirect: { port: '443', protocol: 'HTTPS', statusCode: 'HTTP_301' },
          },
        ],
      }),
      new albListener.AlbListener(stack.context, `${resourceId}_listener_https`, {
        loadBalancerArn: loadBalancer.arn,
        provider: providerInstance,
        port: 443,
        protocol: 'HTTPS',
        certificateArn: certificate.arn,
        dependsOn: [targetGroup, certificate],
        defaultAction: [
          {
            targetGroupArn: targetGroup.arn,
            type: 'forward',
          },
        ],
      }),
    )

    serviceDependencies.push(targetGroup, ...listeners)

    if (config.domain) {
      const domain = config.domain.replace(/^www\.(.*)$/i, '$1')
      const isTld = domain === getTopLevelDomain(domain)
      dnsRecords.push(
        new route53Record.Route53Record(stack.context, `${resourceId}_dns_record`, {
          name: domain,
          zoneId: dnsZone.id,
          provider: providerInstance,
          allowOverwrite: true,
          ...(isTld
            ? {
                type: 'A',
                alias: {
                  name: loadBalancer.dnsName,
                  zoneId: dnsZone.id,
                  evaluateTargetHealth: true,
                },
              }
            : { type: 'CNAME', ttl: 3600, records: [loadBalancer.dnsName] }),
        }),
      )

      if (config.www && isTopLevelDomain(domain)) {
        dnsRecords.push(
          new route53Record.Route53Record(stack.context, `${resourceId}_dns_record_www`, {
            name: `www.${domain}`,
            zoneId: dnsZone.id,
            type: 'CNAME',
            ttl: 3600,
            records: [loadBalancer.dnsName],
            provider: providerInstance,
          }),
        )
      }
    }

    const sg = new securityGroup.SecurityGroup(stack.context, `${resourceId}_security_group`, {
      name: `${config.name}-security-group`,
      description: `Security group for the ${config.name} service`,
      vpcId: vpc.id,
      provider: providerInstance,
      ingress: [
        {
          fromPort: config.port,
          toPort: config.port,
          protocol: 'tcp',
          securityGroups: [vpc.defaultSecurityGroupId],
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
          ipv6CidrBlocks: ['::/0'],
        },
      ],
    })

    securityGroups.push(sg.id)
  }

  const service = new ecsService.EcsService(stack.context, `${resourceId}_service`, {
    name: config.name,
    cluster: cluster.id,
    provider: providerInstance,
    taskDefinition: taskDefinition.arn,
    launchType: 'FARGATE',
    schedulingStrategy: 'REPLICA',
    desiredCount: config.nodes,
    dependsOn: serviceDependencies,
    networkConfiguration: {
      securityGroups,
      subnets: publicSubnets.map((subnet) => subnet.id),
      assignPublicIp: true,
    },
    loadBalancer:
      targetGroup && config.port
        ? [
            {
              targetGroupArn: targetGroup.arn,
              containerName: config.name,
              containerPort: config.port,
            },
          ]
        : undefined,
  })

  const outputs: TerraformOutput[] = [
    new TerraformOutput(stack.context, `${resourceId}_task_definition_arn`, {
      value: taskDefinition.arn,
    }),
  ]

  listeners.forEach((listener, idx) =>
    outputs.push(
      new TerraformOutput(stack.context, `${resourceId}_listener_arn_${idx}`, {
        value: listener.arn,
      }),
    ),
  )

  dnsRecords.forEach((record, idx) =>
    outputs.push(
      new TerraformOutput(stack.context, `${resourceId}_service_dns_record_${idx}`, {
        value: record.name,
      }),
    ),
  )

  return {
    service,
    listeners,
    dnsRecords,
    taskDefinition,
    outputs,
  }
}

export const resourceHandler = (
  provisionable: AwsApplicationProvisionable,
  stack: Stack,
): AwsApplicationResources =>
  pipe(
    () => deployApplication(provisionable, stack),
    withAwsAlerts<AwsApplicationProvisionable>(provisionable, stack, awsApplicationServiceAlarms),
  )()

const getApplicationService = (): AwsApplicationService =>
  pipe(
    behaviors.withHandler(resourceHandler),
    behaviors.withAssociations(getProviderAssociations()),
    behaviors.withAssociations(getNetworkingAssociations()),
    behaviors.withAssociations(getApplicationRequirements()),
    behaviors.withRegions(REGIONS),
    behaviors.multiNode(),
    behaviors.monitored(),
    behaviors.connectable(),
    behaviors.withSchema({
      type: 'object',
      required: ['port'],
      properties: {
        cpu: {
          type: 'number',
          default: 1,
          enum: [0.25, 0.5, 1, 2, 4, 8, 16],
        },
        memory: {
          type: 'number',
          default: 1,
        },
        environment: {
          type: 'object',
          patternProperties: {
            '^[a-zA-Z0-9_]+$': {
              type: 'string',
            },
          },
        },
        domain: {
          type: 'string',
          pattern: getDomainMatcher(),
        },
        www: {
          type: 'boolean',
          default: true,
        },
        image: {
          type: 'string',
        },
      },
      allOf: [
        {
          if: { properties: { cpu: { enum: [0.25] } } },
          then: { properties: { memory: { enum: [0.5, 1, 2] } } },
          errorMessage: 'Memory for 0.25 vCPU should be either 0.5, 1 or 2 GB',
        },
        {
          if: { properties: { cpu: { enum: [0.5] } } },
          then: { properties: { memory: { type: 'integer', minimum: 1, maximum: 4 } } },
          errorMessage: 'Memory for 0.5 vCPU should be between 1 and 4 GB',
        },
        {
          if: { properties: { cpu: { enum: [1] } } },
          then: { properties: { memory: { type: 'integer', minimum: 2, maximum: 8 } } },
          errorMessage: 'Memory for 1 vCPU should be between 2 and 8 GB',
        },
        {
          if: { properties: { cpu: { enum: [2] } } },
          then: { properties: { memory: { type: 'integer', minimum: 4, maximum: 16 } } },
          errorMessage: 'Memory for 2 vCPUs should be between 4 and 16 GB',
        },
        {
          if: { properties: { cpu: { enum: [4] } } },
          then: { properties: { memory: { type: 'integer', minimum: 8, maximum: 30 } } },
          errorMessage: 'Memory for 4 vCPUs should be between 8 and 30 GB',
        },
        {
          if: { properties: { cpu: { enum: [8] } } },
          then: { properties: { memory: { type: 'integer', minimum: 16, maximum: 60 } } },
          errorMessage: 'Memory for 8 vCPUs should be between 16 and 60 GB',
        },
        {
          if: { properties: { cpu: { enum: [16] } } },
          then: { properties: { memory: { type: 'integer', minimum: 32, maximum: 120 } } },
          errorMessage: 'Memory for 16 vCPUs should be between 32 and 120 GB',
        },
      ],
    }),
  )(getBaseService(PROVIDER.AWS, SERVICE_TYPE.APP))

export const AwsApplication = getApplicationService()
