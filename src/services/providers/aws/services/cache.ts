import pipe from 'lodash/fp/pipe'
import { SERVICE_TYPE, DEFAULT_PORT, PROVIDER } from '@src/constants'
import { awsCacheAlarms } from '@aws/alerts/cache'
import { getBaseService, getProfile } from '@services/utils'
import * as AWS from '@aws/constants'
import * as behavior from '@services/behaviors'
import { onServiceLinked } from '@aws/utils/onServiceLinked'
import { onExternalLink } from '@aws/utils/onExternalLink'
import { withAwsAlerts } from '@aws/utils/withAlerts'
import {
  elasticacheReplicationGroup,
  elasticacheParameterGroup,
  elasticacheSubnetGroup,
  elasticacheCluster,
  cloudwatchLogGroup,
} from '@cdktf/provider-aws'
import { kebabCase } from 'lodash'
import { TerraformOutput } from 'cdktf'
import { elasticacheClusterLogDeliveryConfigurationToTerraform } from '@cdktf/provider-aws/lib/elasticache-cluster'
import { REGIONS } from '@aws/constants'
import { getProviderAssociations } from '@aws/utils/getProviderAssociations'
import { getNetworkingAssociations } from '@aws/utils/getNetworkingAssociations'
import type { ElasticacheEngine } from '@aws/constants'
import type { Stack } from '@lib/stack'
import type { OneOfType } from '@lib/util'
import type {
  BaseServiceAttributes,
  Provisionable,
  Service,
  ServiceTypeChoice,
} from '@services/types'
import type { AwsNetworkingAssociations, AwsProviderAssociations } from '@aws/types'

type CacheAttributes = BaseServiceAttributes &
  behavior.RegionalAttributes &
  behavior.ClusteredAttributes &
  behavior.SizeableAttributes &
  behavior.VersioningAttributes &
  behavior.LinkableAttributes &
  behavior.ExternallyLinkableAttributes &
  behavior.MultiNodeAttributes &
  behavior.ConnectableAttributes &
  behavior.ProfilableAttributes &
  behavior.RegionalAttributes &
  behavior.EngineAttributes<ElasticacheEngine> &
  behavior.MonitoringAttributes & {
    provider: typeof PROVIDER.AWS
  }

export type AwsCacheResources = {
  instance?: elasticacheCluster.ElasticacheCluster
  cluster?: elasticacheReplicationGroup.ElasticacheReplicationGroup
  logGroup: cloudwatchLogGroup.CloudwatchLogGroup
  paramGroup: elasticacheParameterGroup.ElasticacheParameterGroup
  subnetGroup: elasticacheSubnetGroup.ElasticacheSubnetGroup
  outputs: TerraformOutput[]
}

export type AwsCacheAttributes<
  T extends ServiceTypeChoice,
  E extends ElasticacheEngine,
> = CacheAttributes & behavior.EngineAttributes<E> & { type: T }

export type AwsRedisAttributes = AwsCacheAttributes<'redis', 'redis'>
export type AwsMemcachedAttributes = AwsCacheAttributes<'memcached', 'memcached'>

type AwsCacheService<Attrs extends CacheAttributes> = Service<
  Attrs,
  AwsProviderAssociations & AwsNetworkingAssociations
>

export type AwsRedisService = AwsCacheService<AwsRedisAttributes>
export type AwsMemcachedService = AwsCacheService<AwsMemcachedAttributes>

type AwsCache = OneOfType<[AwsRedisService, AwsMemcachedService]>

export type AwsCacheProvisionable = Provisionable<AwsCache, AwsCacheResources>

/**
 * @param {DatabaseAttributes} config the service's configuration
 * @returns {String} the parameter group family to use when provisioning the database
 */
export const getParamGroupFamily = (config: CacheAttributes): string => {
  const triad = AWS.ELASTICACHE_PARAM_FAMILY_MAPPING.find(
    ([engine, version]) => engine === config.engine && config.version.startsWith(version),
  )

  if (!triad) {
    throw new Error(
      `We couldn’t determine the parameter group family for engine ${config.engine} version ${config.version}`,
    )
  }

  return triad[2]
}

/**
 * Attempts to distribute the nodes number evenly between node groups and replicas
 *
 * @param {Number} nodes the number of nodes in the setup
 * @returns {Object}
 */
export const getClusterSetup = (nodes: number): { nodeGroups: number; replicas: number } => {
  if (nodes === 1) {
    return {
      nodeGroups: 1,
      replicas: 0,
    }
  }

  return {
    nodeGroups: Math.floor(nodes / 2),
    replicas: 1,
  }
}

/**
 * Provisions the database service
 *
 * @param {AwsCacheProvisionable} provisionable the service's configuration
 * @param {Stack} stack the stack to deploy
 * @returns {Provisions} the provisions generated
 */
const deployCaches =
  (provisionable: AwsCacheProvisionable, stack: Stack): (() => AwsCacheResources) =>
  (): AwsCacheResources => {
    const {
      config,
      requirements: { providerInstance, subnets, vpc },
      resourceId,
    } = provisionable

    const { cluster: clusterOptions, instance: instanceOptions, params } = getProfile(config)

    const clusterName = kebabCase(`${config.name}-${stack.name}`)

    const subnetGroup = new elasticacheSubnetGroup.ElasticacheSubnetGroup(
      stack.context,
      `${resourceId}-subnetGroup`,
      {
        subnetIds: subnets.map((subnet) => subnet.id),
        name: `${clusterName}-subnet-group`,
        provider: providerInstance,
      },
    )

    const paramGroup = new elasticacheParameterGroup.ElasticacheParameterGroup(
      stack.context,
      `${resourceId}_params`,
      {
        ...params,
        family: getParamGroupFamily(config),
      },
    )

    const logGroup = new cloudwatchLogGroup.CloudwatchLogGroup(
      stack.context,
      `${resourceId}_log_group`,
      {
        name: `${resourceId}-log-group`,
      },
    )

    const logDeliveryConfiguration = elasticacheClusterLogDeliveryConfigurationToTerraform({
      destination: logGroup.name,
      destinationType: 'cloudwatch-logs',
      logFormat: 'text',
      logType: 'slow-log',
    })

    let instance: elasticacheCluster.ElasticacheCluster | undefined
    let cluster: elasticacheReplicationGroup.ElasticacheReplicationGroup | undefined
    const outputs: TerraformOutput[] = []

    if (config.type === SERVICE_TYPE.MEMCACHED || (config.nodes === 1 && !config.cluster)) {
      instance = new elasticacheCluster.ElasticacheCluster(stack.context, resourceId, {
        ...instanceOptions,
        applyImmediately: true,
        clusterId: clusterName,
        engine: config.engine,
        engineVersion: config.version,
        logDeliveryConfiguration,
        nodeType: config.size,
        numCacheNodes: config.nodes,
        port: config.port,
        provider: providerInstance,
        parameterGroupName: paramGroup.name,
        securityGroupIds: [vpc.defaultSecurityGroupId],
      })

      outputs.push(
        new TerraformOutput(stack.context, `${resourceId}_endpoint`, {
          description: `Connection endpoint for "${config.name}" Elasticache service`,
          value:
            config.type === 'memcached'
              ? instance.configurationEndpoint
              : instance.cacheNodes.get(0).address,
        }),
      )
    } else {
      const { nodeGroups, replicas } = getClusterSetup(config.nodes)

      cluster = new elasticacheReplicationGroup.ElasticacheReplicationGroup(
        stack.context,
        resourceId,
        {
          ...clusterOptions,
          applyImmediately: true,
          engine: config.engine,
          engineVersion: config.version,
          logDeliveryConfiguration,
          nodeType: config.size,
          numCacheClusters: 1,
          numNodeGroups: nodeGroups,
          port: config.port,
          provider: providerInstance,
          parameterGroupName: paramGroup.name,
          replicasPerNodeGroup: replicas,
          replicationGroupId: clusterName,
          securityGroupIds: [vpc.defaultSecurityGroupId],
        },
      )

      outputs.push(
        new TerraformOutput(stack.context, `${resourceId}_endpoint`, {
          description: `Connection endpoint for "${config.name}" Elasticache service`,
          value: cluster.primaryEndpointAddress,
        }),
      )
    }

    return { instance, cluster, logGroup, paramGroup, subnetGroup, outputs }
  }

/**
 * Provisions the database resources along with monitoring resources
 *
 * @param {AwsCacheProvisionable} provisionable the service's configuration
 * @param {Stack} stack the stack to deploy
 * @returns {Provisions} the provisions generated
 */
export const resourceHandler = (
  provisionable: AwsCacheProvisionable,
  stack: Stack,
): AwsCacheResources =>
  pipe(
    deployCaches(provisionable, stack),
    withAwsAlerts<AwsCacheProvisionable>(provisionable, stack, awsCacheAlarms),
  )()

/**
 * @param {ServiceTypeChoice} type the type of service to instantiate
 * @param {RdsEngine} engine the RDS engine to use
 * @returns {AwsDatabaseService<DatabaseAttributes>} the database service
 */
const getCacheService = <T extends ServiceTypeChoice, E extends ElasticacheEngine>(
  type: T,
  engine: E,
): AwsCacheService<AwsCacheAttributes<T, E>> => {
  const defaultPort = DEFAULT_PORT.get(type)
  if (!defaultPort) {
    throw new Error(`There is no default port set for service ${type}`)
  }

  return pipe(
    behavior.clustered(),
    behavior.withHandler(resourceHandler),
    behavior.linkable(onServiceLinked),
    behavior.externallyLinkable(onExternalLink),
    behavior.monitored(),
    behavior.sizeable('^cache\\.[a-z0-9]+\\.[a-z0-9]+$', AWS.DEFAULT_ELASTICACHE_INSTANCE_SIZE),
    behavior.versioned(
      AWS.ELASTICACHE_VERSIONS_PER_ENGINE[engine],
      AWS.ELASTICACHE_DEFAULT_VERSIONS_PER_ENGINE[engine],
    ),
    behavior.connectable(defaultPort),
    behavior.withEngine<typeof engine>(engine),
    behavior.multiNode(),
    behavior.profileable(),
    behavior.withRegions(REGIONS),
    behavior.withAssociations({
      ...getProviderAssociations(),
      ...getNetworkingAssociations(),
    }),
  )(getBaseService(PROVIDER.AWS, type))
}

export const AwsRedis: AwsRedisService = getCacheService(SERVICE_TYPE.REDIS, 'redis')
export const AwsMemcached: AwsMemcachedService = getCacheService(
  SERVICE_TYPE.MEMCACHED,
  'memcached',
)
