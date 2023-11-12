import pipe from 'lodash/fp/pipe'
import { SERVICE_TYPE, DEFAULT_PORT } from '@src/constants'
import { awsDatabaseAlarms } from '@aws/alerts/database'
import { getProfile } from '@services/utils'
import { getAwsService } from '@aws/utils/getAwsService'
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
} from '@cdktf/provider-aws'
import { kebabCase } from 'lodash'
import { TerraformOutput } from 'cdktf'
import type { Stack } from '@lib/stack'
import type { ChoiceOf, OneOfType } from '@lib/util'
import type { PROVIDER } from '@src/constants'
import type { BaseServiceAttributes, Provisionable, ServiceTypeChoice } from '@services/types'
import type { AwsService } from '@aws/types'
import type { ElasticacheEngine, REGIONS } from '@aws/constants'

type CacheAttributes = BaseServiceAttributes &
  behavior.SizeableAttributes &
  behavior.VersioningAttributes &
  behavior.LinkableAttributes &
  behavior.ExternallyLinkableAttributes &
  behavior.MultiNodeAttributes &
  behavior.StorableAttributes &
  behavior.ConnectableAttributes &
  behavior.ProfilableAttributes &
  behavior.RegionalAttributes<ChoiceOf<typeof REGIONS>> &
  behavior.EngineAttributes<ElasticacheEngine> &
  behavior.MonitoringAttributes & {
    provider: typeof PROVIDER.AWS
  }

export type AwsCacheResources = {
  instance?: elasticacheCluster.ElasticacheCluster
  cluster?: elasticacheReplicationGroup.ElasticacheReplicationGroup
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

type AwsCacheService<Attrs extends CacheAttributes> = AwsService<Attrs>

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

    let instance: elasticacheCluster.ElasticacheCluster | undefined
    let cluster: elasticacheReplicationGroup.ElasticacheReplicationGroup | undefined
    const outputs: TerraformOutput[] = []

    if (config.nodes === 1) {
      instance = new elasticacheCluster.ElasticacheCluster(stack.context, resourceId, {
        ...instanceOptions,
        applyImmediately: true,
        nodeType: config.size,
        engine: config.engine,
        engineVersion: config.version,
        clusterId: clusterName,
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
          nodeType: config.size,
          engine: config.engine,
          engineVersion: config.version,
          replicationGroupId: clusterName,
          numCacheClusters: 1,
          numNodeGroups: nodeGroups,
          replicasPerNodeGroup: replicas,
          port: config.port,
          provider: providerInstance,
          parameterGroupName: paramGroup.name,
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

    return { instance, cluster, paramGroup, subnetGroup, outputs }
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
    withAwsAlerts<AwsCacheProvisionable>(provisionable, stack, awsDatabaseAlarms),
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
    behavior.storable(),
    behavior.withEngine<typeof engine>(engine),
    behavior.multiNode(),
    behavior.profileable(),
    behavior.withDatabase(),
  )(getAwsService(type))
}

export const AwsRedis: AwsRedisService = getCacheService(SERVICE_TYPE.REDIS, 'redis')
export const AwsMemcached: AwsMemcachedService = getCacheService(
  SERVICE_TYPE.MEMCACHED,
  'memcached',
)
