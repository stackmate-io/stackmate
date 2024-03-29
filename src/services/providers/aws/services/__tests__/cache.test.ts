import { AwsMemcached, AwsRedis } from '@aws/services/cache'
import { CONSTRAINTS, DEFAULT_ELASTICACHE_INSTANCE_SIZE, REGIONS } from '@aws/constants'
import { DEFAULT_PROFILE_NAME, PROVIDER, SERVICE_TYPE } from '@src/constants'
import { getAwsCacheConfigMock } from '@tests/mocks/aws'
import {
  cloudwatchLogGroup,
  cloudwatchMetricAlarm,
  elasticacheCluster,
  elasticacheParameterGroup,
  elasticacheReplicationGroup,
  elasticacheSubnetGroup,
  snsTopic,
} from '@cdktf/provider-aws'
import { snakeCase } from 'lodash'
import { Registry } from '@src/services/registry'
import { getSynthesizedStack } from '@tests/helpers/getSynthesizedStack'
import { DEFAULT_REGION, ENVIRONMENT } from '@src/project/constants'
import type { AwsCacheServiceType, ElasticacheEngine } from '@aws/types'
import type { ServiceConfiguration } from '@src/services/registry'

const getCacheSchemaExpectation = (
  type: AwsCacheServiceType,
  engine: ElasticacheEngine,
  versions: readonly string[],
  defaultVersion: string,
) => ({
  $id: `services-aws-${type}`,
  type: 'object',
  required: expect.arrayContaining(['provider', 'name', 'type']),
  additionalProperties: false,
  properties: {
    provider: expect.objectContaining({ const: PROVIDER.AWS }),
    type: expect.objectContaining({ const: type }),
    region: expect.objectContaining({ type: 'string', enum: expect.arrayContaining(REGIONS) }),
    name: expect.objectContaining({
      type: 'string',
      pattern: expect.stringContaining('a-zA-Z0-9'),
    }),
    version: expect.objectContaining({
      type: 'string',
      enum: Array.from(versions),
      default: defaultVersion,
    }),
    engine: expect.objectContaining({ type: 'string', enum: [engine], default: engine }),
    nodes: expect.objectContaining({ type: 'number', minimum: 1, maximum: 10000, default: 1 }),
    profile: expect.objectContaining({
      type: 'string',
      default: DEFAULT_PROFILE_NAME,
      serviceProfile: true,
    }),
    overrides: expect.objectContaining({
      type: 'object',
      default: {},
      serviceProfileOverrides: true,
    }),
    size: expect.objectContaining({
      type: 'string',
      enum: expect.arrayContaining([DEFAULT_ELASTICACHE_INSTANCE_SIZE]),
      default: DEFAULT_ELASTICACHE_INSTANCE_SIZE,
    }),
  },
})

describe('Redis cache', () => {
  const service = AwsRedis

  it('is a valid AWS Redis Elasticache service', () => {
    expect(service.provider).toEqual(PROVIDER.AWS)
    expect(service.type).toEqual(SERVICE_TYPE.REDIS)
  })

  it('is fetched by the registry', () => {
    expect(Registry.get(PROVIDER.AWS, SERVICE_TYPE.REDIS))
  })

  it('provides constraints', () => {
    expect(CONSTRAINTS[SERVICE_TYPE.REDIS]).toMatchObject({
      familyMapping: expect.arrayContaining([]),
      regions: expect.arrayContaining([DEFAULT_REGION.aws]),
      sizes: expect.arrayContaining([DEFAULT_ELASTICACHE_INSTANCE_SIZE]),
      versions: expect.arrayContaining([]),
      defaultVersion: expect.stringMatching(/\d+\.\d+(\.\d+)?/),
    })
  })

  it('has the AWS regions set', () => {
    expect(service.regions).toEqual(expect.arrayContaining(CONSTRAINTS[SERVICE_TYPE.REDIS].regions))
  })

  it('provides a valid schema', () => {
    const versions = CONSTRAINTS[SERVICE_TYPE.REDIS].versions
    const defaultVersion = CONSTRAINTS[SERVICE_TYPE.REDIS].defaultVersion
    expect(Array.isArray(versions)).toBe(true)
    expect(versions.length).toBeGreaterThan(0)
    expect(typeof defaultVersion === 'string').toBe(true)
    expect(service.schema).toMatchObject(
      getCacheSchemaExpectation(SERVICE_TYPE.REDIS, 'redis', versions, defaultVersion),
    )
  })

  it('registers the resources on deployment - single instance', () => {
    const config = getAwsCacheConfigMock('redis', 'redis', false)
    const stack = getSynthesizedStack([config])
    expect(stack).toHaveResource(elasticacheCluster.ElasticacheCluster)
    expect(stack).not.toHaveResource(elasticacheReplicationGroup.ElasticacheReplicationGroup)
    expect(stack).toHaveResource(elasticacheParameterGroup.ElasticacheParameterGroup)
    expect(stack).toHaveResource(cloudwatchLogGroup.CloudwatchLogGroup)
    expect(stack).toHaveResource(elasticacheSubnetGroup.ElasticacheSubnetGroup)
  })

  it('registers the resources on deployment - cluster', () => {
    const config = getAwsCacheConfigMock('redis', 'redis', true)
    const stack = getSynthesizedStack([config])

    expect(stack).not.toHaveResource(elasticacheCluster.ElasticacheCluster)
    expect(stack).toHaveResource(elasticacheReplicationGroup.ElasticacheReplicationGroup)
    expect(stack).toHaveResource(elasticacheParameterGroup.ElasticacheParameterGroup)
    expect(stack).toHaveResource(cloudwatchLogGroup.CloudwatchLogGroup)
    expect(stack).toHaveResource(elasticacheSubnetGroup.ElasticacheSubnetGroup)
  })
})

describe('Memcached cache', () => {
  const service = AwsMemcached

  it('is a valid AWS Memcached Elasticache service', () => {
    expect(service.provider).toEqual(PROVIDER.AWS)
    expect(service.type).toEqual(SERVICE_TYPE.MEMCACHED)
  })

  it('is fetched by the registry', () => {
    expect(Registry.get(PROVIDER.AWS, SERVICE_TYPE.REDIS))
  })

  it('provides constraints', () => {
    expect(CONSTRAINTS[SERVICE_TYPE.MEMCACHED]).toMatchObject({
      familyMapping: expect.arrayContaining([]),
      regions: expect.arrayContaining([DEFAULT_REGION.aws]),
      sizes: expect.arrayContaining([DEFAULT_ELASTICACHE_INSTANCE_SIZE]),
      versions: expect.arrayContaining([]),
      defaultVersion: expect.stringMatching(/\d+\.\d+(\.\d+)?/),
    })
  })

  it('has the AWS regions set', () => {
    expect(service.regions).toEqual(
      expect.arrayContaining(CONSTRAINTS[SERVICE_TYPE.MEMCACHED].regions),
    )
  })

  it('provides a valid schema', () => {
    const versions = CONSTRAINTS[SERVICE_TYPE.MEMCACHED].versions
    const defaultVersion = CONSTRAINTS[SERVICE_TYPE.MEMCACHED].defaultVersion
    expect(Array.isArray(versions)).toBe(true)
    expect(versions.length).toBeGreaterThan(0)
    expect(typeof defaultVersion === 'string').toBe(true)
    expect(service.schema).toMatchObject(
      getCacheSchemaExpectation(SERVICE_TYPE.MEMCACHED, 'memcached', versions, defaultVersion),
    )
  })

  it('registers the resources on deployment', () => {
    const config = getAwsCacheConfigMock('memcached', 'memcached', true)
    const stack = getSynthesizedStack([config])

    expect(stack).toHaveResource(elasticacheCluster.ElasticacheCluster)
    expect(stack).not.toHaveResource(elasticacheReplicationGroup.ElasticacheReplicationGroup)
    expect(stack).toHaveResource(elasticacheParameterGroup.ElasticacheParameterGroup)
    expect(stack).toHaveResource(cloudwatchLogGroup.CloudwatchLogGroup)
    expect(stack).toHaveResource(elasticacheSubnetGroup.ElasticacheSubnetGroup)
  })
})

describe('Cache service monitoring', () => {
  const environment = ENVIRONMENT.PRODUCTION

  const runExpectations = (config: ServiceConfiguration) => {
    const stack = getSynthesizedStack([config], environment)

    const alarmPrefix = snakeCase(`${config.name}_${environment}`)
    expect(stack).toHaveResourceWithProperties(snsTopic.SnsTopic, {
      name: expect.stringContaining(snakeCase(config.name)),
    })

    expect(stack).toHaveResourceWithProperties(cloudwatchMetricAlarm.CloudwatchMetricAlarm, {
      alarm_name: expect.stringContaining(`${alarmPrefix}_cpu_utilization`),
      metric_name: 'CPUUtilization',
    })

    expect(stack).toHaveResourceWithProperties(cloudwatchMetricAlarm.CloudwatchMetricAlarm, {
      alarm_name: expect.stringContaining(`${alarmPrefix}_freeable_memory`),
      metric_name: 'FreeableMemory',
    })
  }

  it('provides monitoring for the database service - redis single instance', () => {
    const config = getAwsCacheConfigMock('redis', 'redis', false)
    runExpectations(config)
  })

  it('provides monitoring for the database service - redis cluster', () => {
    const config = getAwsCacheConfigMock('redis', 'redis', true)
    runExpectations(config)
  })

  it('provides monitoring for the database service - redis cluster', () => {
    const config = getAwsCacheConfigMock('memcached', 'memcached', true)
    runExpectations(config)
  })
})
