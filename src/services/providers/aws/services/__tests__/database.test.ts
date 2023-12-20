import { snakeCase } from 'lodash'
import {
  cloudwatchMetricAlarm,
  dataAwsIamPolicyDocument,
  dbEventSubscription,
  dbInstance as awsDbInstance,
  dbParameterGroup as awsDbParameterGroup,
  snsTopic,
  snsTopicPolicy,
} from '@cdktf/provider-aws'
import { getAwsDbConfigMock } from '@tests/mocks/aws'
import {
  PROVIDER,
  SERVICE_TYPE,
  DEFAULT_PROFILE_NAME,
  DEFAULT_SERVICE_STORAGE,
} from '@src/constants'
import { AwsMariaDB, AwsMySQL, AwsPostgreSQL } from '@aws/services/database'
import { DEFAULT_RDS_INSTANCE_SIZE, CONSTRAINTS, REGIONS } from '@aws/constants'
import { Registry } from '@src/services/registry'
import { getSynthesizedStack } from '@tests/helpers/getSynthesizedStack'
import { DEFAULT_REGION, ENVIRONMENT } from '@src/project/constants'
import type {
  AwsMariaDBAttributes,
  AwsMySQLAttributes,
  AwsPostgreSQLAttributes,
} from '@aws/services/database'
import type { AwsDbServiceType, RdsEngine } from '../../types'

const getDatabaseSchemaExpectation = (
  type: AwsDbServiceType,
  engine: RdsEngine,
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
    database: expect.objectContaining({
      type: 'string',
      pattern: expect.stringContaining('a-zA-Z0-9'),
    }),
    storage: expect.objectContaining({
      type: 'number',
      minimum: 1,
      maximum: 100000,
      default: DEFAULT_SERVICE_STORAGE,
    }),
    size: expect.objectContaining({
      type: 'string',
      enum: expect.arrayContaining([DEFAULT_RDS_INSTANCE_SIZE]),
      default: DEFAULT_RDS_INSTANCE_SIZE,
    }),
  },
})

describe('AWS PostgreSQL', () => {
  const service = AwsPostgreSQL

  it('is a valid AWS PostgreSQL service', () => {
    expect(service.provider).toEqual(PROVIDER.AWS)
    expect(service.type).toEqual(SERVICE_TYPE.POSTGRESQL)
  })

  it('is fetched by the registry', () => {
    expect(Registry.get(PROVIDER.AWS, SERVICE_TYPE.POSTGRESQL))
  })

  it('provides constraints', () => {
    expect(CONSTRAINTS[SERVICE_TYPE.POSTGRESQL]).toMatchObject({
      familyMapping: expect.arrayContaining([]),
      regions: expect.arrayContaining([DEFAULT_REGION.aws]),
      sizes: expect.arrayContaining([DEFAULT_RDS_INSTANCE_SIZE]),
      versions: expect.arrayContaining([]),
      defaultVersion: expect.stringMatching(/\d+\.\d+(\.\d+)?/),
    })
  })

  it('has the AWS regions set', () => {
    expect(service.regions).toEqual(expect.arrayContaining(CONSTRAINTS[SERVICE_TYPE.MYSQL].regions))
  })

  it('provides a valid schema', () => {
    const versions = CONSTRAINTS[SERVICE_TYPE.POSTGRESQL].versions
    const defaultVersion = CONSTRAINTS[SERVICE_TYPE.POSTGRESQL].defaultVersion
    expect(Array.isArray(versions)).toBe(true)
    expect(versions.length).toBeGreaterThan(0)
    expect(typeof defaultVersion === 'string').toBe(true)
    expect(service.schema).toMatchObject(
      getDatabaseSchemaExpectation(SERVICE_TYPE.POSTGRESQL, 'postgres', versions, defaultVersion),
    )
  })

  it('registers the resources on deployment', () => {
    const config = getAwsDbConfigMock('postgresql', 'postgres') as AwsPostgreSQLAttributes
    const stack = getSynthesizedStack([config])

    expect(stack).toHaveResource(awsDbInstance.DbInstance)
    expect(stack).toHaveResource(awsDbParameterGroup.DbParameterGroup)
  })
})

describe('AWS MySQL', () => {
  const service = AwsMySQL

  it('is a valid AWS MySQL service', () => {
    expect(service.provider).toEqual(PROVIDER.AWS)
    expect(service.type).toEqual(SERVICE_TYPE.MYSQL)
  })

  it('is fetched by the registry', () => {
    expect(Registry.get(PROVIDER.AWS, SERVICE_TYPE.MYSQL))
  })

  it('provides constraints', () => {
    expect(CONSTRAINTS[SERVICE_TYPE.MYSQL]).toMatchObject({
      familyMapping: expect.arrayContaining([]),
      regions: expect.arrayContaining([DEFAULT_REGION.aws]),
      sizes: expect.arrayContaining([DEFAULT_RDS_INSTANCE_SIZE]),
      versions: expect.arrayContaining([]),
      defaultVersion: expect.stringMatching(/\d+\.\d+(\.\d+)?/),
    })
  })

  it('has the AWS regions set', () => {
    expect(service.regions).toEqual(expect.arrayContaining(CONSTRAINTS[SERVICE_TYPE.MYSQL].regions))
  })

  it('provides a valid schema', () => {
    const versions = CONSTRAINTS[SERVICE_TYPE.MYSQL].versions
    const defaultVersion = CONSTRAINTS[SERVICE_TYPE.MYSQL].defaultVersion
    expect(Array.isArray(versions)).toBe(true)
    expect(versions.length).toBeGreaterThan(0)
    expect(typeof defaultVersion === 'string').toBe(true)
    expect(service.schema).toMatchObject(
      getDatabaseSchemaExpectation(SERVICE_TYPE.MYSQL, 'mysql', versions, defaultVersion),
    )
  })

  it('registers the resources on deployment', () => {
    const config = getAwsDbConfigMock('mysql', 'mysql') as AwsMySQLAttributes
    const stack = getSynthesizedStack([config])
    expect(stack).toHaveResource(awsDbInstance.DbInstance)
    expect(stack).toHaveResource(awsDbParameterGroup.DbParameterGroup)
  })
})

describe('AWS MariaDB', () => {
  const service = AwsMariaDB

  it('is a valid AWS MySQL service', () => {
    expect(service.provider).toEqual(PROVIDER.AWS)
    expect(service.type).toEqual(SERVICE_TYPE.MARIADB)
  })

  it('is fetched by the registry', () => {
    expect(Registry.get(PROVIDER.AWS, SERVICE_TYPE.MARIADB))
  })

  it('provides constraints', () => {
    expect(CONSTRAINTS[SERVICE_TYPE.MARIADB]).toMatchObject({
      familyMapping: expect.arrayContaining([]),
      regions: expect.arrayContaining([DEFAULT_REGION.aws]),
      sizes: expect.arrayContaining([DEFAULT_RDS_INSTANCE_SIZE]),
      versions: expect.arrayContaining([]),
      defaultVersion: expect.stringMatching(/\d+\.\d+(\.\d+)?/),
    })
  })

  it('has the AWS regions set', () => {
    expect(service.regions).toEqual(expect.arrayContaining(CONSTRAINTS[SERVICE_TYPE.MYSQL].regions))
  })

  it('provides a valid schema', () => {
    const versions = CONSTRAINTS[SERVICE_TYPE.MARIADB].versions
    const defaultVersion = CONSTRAINTS[SERVICE_TYPE.MARIADB].defaultVersion
    expect(Array.isArray(versions)).toBe(true)
    expect(versions.length).toBeGreaterThan(0)
    expect(typeof defaultVersion === 'string').toBe(true)
    expect(service.schema).toMatchObject(
      getDatabaseSchemaExpectation(SERVICE_TYPE.MARIADB, 'mariadb', versions, defaultVersion),
    )
  })

  it('registers the resources on deployment', () => {
    const config = getAwsDbConfigMock('mariadb', 'mariadb') as AwsMariaDBAttributes
    const stack = getSynthesizedStack([config])

    expect(stack).toHaveResource(awsDbInstance.DbInstance)
    expect(stack).toHaveResource(awsDbParameterGroup.DbParameterGroup)
  })
})

describe('Database service monitoring', () => {
  const environment = ENVIRONMENT.PRODUCTION

  it('provides monitoring for the database service', () => {
    const config = getAwsDbConfigMock('mariadb', 'mariadb') as AwsMariaDBAttributes
    const stack = getSynthesizedStack([config], environment)

    const alarmPrefix = snakeCase(`${config.name}_${environment}`)
    expect(stack).toHaveResourceWithProperties(snsTopic.SnsTopic, {
      name: expect.stringContaining(snakeCase(config.name)),
    })

    expect(stack).toHaveResourceWithProperties(snsTopicPolicy.SnsTopicPolicy, {})

    expect(stack).toHaveDataSourceWithProperties(
      dataAwsIamPolicyDocument.DataAwsIamPolicyDocument,
      {},
    )

    expect(stack).toHaveResourceWithProperties(dbEventSubscription.DbEventSubscription, {
      name: expect.stringContaining(`${alarmPrefix}_event_subscription`),
      source_type: 'db-instance',
      event_categories: [
        'failover',
        'failure',
        'low storage',
        'maintenance',
        'notification',
        'recovery',
      ],
    })

    expect(stack).toHaveResourceWithProperties(cloudwatchMetricAlarm.CloudwatchMetricAlarm, {
      alarm_name: expect.stringContaining(`${alarmPrefix}_burst_balance`),
      metric_name: 'BurstBalance',
    })

    expect(stack).toHaveResourceWithProperties(cloudwatchMetricAlarm.CloudwatchMetricAlarm, {
      alarm_name: expect.stringContaining(`${alarmPrefix}_cpu_utilization`),
      metric_name: 'CPUUtilization',
    })

    expect(stack).toHaveResourceWithProperties(cloudwatchMetricAlarm.CloudwatchMetricAlarm, {
      alarm_name: expect.stringContaining(`${alarmPrefix}_cpu_credit_balance`),
      metric_name: 'CPUCreditBalance',
    })

    expect(stack).toHaveResourceWithProperties(cloudwatchMetricAlarm.CloudwatchMetricAlarm, {
      alarm_name: expect.stringContaining(`${alarmPrefix}_disk_depth`),
      metric_name: 'DiskQueueDepth',
    })

    expect(stack).toHaveResourceWithProperties(cloudwatchMetricAlarm.CloudwatchMetricAlarm, {
      alarm_name: expect.stringContaining(`${alarmPrefix}_freeable_memory`),
      metric_name: 'FreeableMemory',
    })

    expect(stack).toHaveResourceWithProperties(cloudwatchMetricAlarm.CloudwatchMetricAlarm, {
      alarm_name: expect.stringContaining(`${alarmPrefix}_free_storage`),
      metric_name: 'FreeStorageSpace',
    })

    expect(stack).toHaveResourceWithProperties(cloudwatchMetricAlarm.CloudwatchMetricAlarm, {
      alarm_name: expect.stringContaining(`${alarmPrefix}_swap_usage`),
      metric_name: 'SwapUsage',
    })
  })
})
