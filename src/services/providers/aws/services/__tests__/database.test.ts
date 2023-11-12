import { faker } from '@faker-js/faker'
import { snakeCase } from 'lodash'
import { Testing } from 'cdktf'
import {
  cloudwatchMetricAlarm,
  dataAwsIamPolicyDocument,
  dbEventSubscription,
  dbInstance as awsDbInstance,
  dbParameterGroup as awsDbParameterGroup,
  snsTopic,
  snsTopicPolicy,
} from '@cdktf/provider-aws'
import { Stack } from '@lib/stack'
import { getAwsDbConfigMock, getAwsProvisionable } from '@tests/mocks'
import {
  PROVIDER,
  SERVICE_TYPE,
  DEFAULT_PROFILE_NAME,
  DEFAULT_SERVICE_STORAGE,
} from '@src/constants'
import { AwsMariaDB, AwsMySQL, AwsPostgreSQL, resourceHandler } from '@aws/services/database'
import {
  DEFAULT_RDS_INSTANCE_SIZE,
  REGIONS,
  RDS_MAJOR_VERSIONS_PER_ENGINE,
  RDS_DEFAULT_VERSIONS_PER_ENGINE,
} from '@aws/constants'
import type { ServiceTypeChoice } from '@services/types'
import type {
  AwsMariaDBAttributes,
  AwsMySQLAttributes,
  AwsDatabaseProvisionable,
} from '@aws/services/database'
import type { RdsEngine } from '@aws/constants'

const getDatabaseSchemaExpectation = (
  type: ServiceTypeChoice,
  engine: RdsEngine,
  versions: readonly string[],
  defaultVersion: string,
) => ({
  $id: `services/aws/${type}`,
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
      pattern: expect.stringContaining('^db\\.[a-z0-9]+\\.[a-z0-9]+$'),
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

  it('has the AWS regions set', () => {
    expect(new Set(service.regions)).toEqual(new Set(REGIONS))
  })

  it('provides a valid schema', () => {
    const engine: RdsEngine = 'postgres'
    const versions = RDS_MAJOR_VERSIONS_PER_ENGINE[engine]
    const defaultVersion = RDS_DEFAULT_VERSIONS_PER_ENGINE[engine]
    expect(Array.isArray(versions)).toBe(true)
    expect(versions.length).toBeGreaterThan(0)
    expect(typeof defaultVersion === 'string').toBe(true)
    expect(service.schema).toMatchObject(
      getDatabaseSchemaExpectation(SERVICE_TYPE.POSTGRESQL, engine, versions, defaultVersion),
    )
  })

  it('registers the resources on deployment', () => {
    const stack = new Stack('stack-name')
    const config = getAwsDbConfigMock('postgresql', 'postgres')
    const provisionable = getAwsProvisionable(config, stack, {
      withRootCredentials: true,
    })

    const resources = service.handler(provisionable, stack)
    expect(typeof resources === 'object').toBe(true)
    expect(resources.dbInstance).toBeInstanceOf(awsDbInstance.DbInstance)
    expect(resources.paramGroup).toBeInstanceOf(awsDbParameterGroup.DbParameterGroup)
  })
})

describe('AWS MySQL', () => {
  const service = AwsMySQL

  it('is a valid AWS MySQL service', () => {
    expect(service.provider).toEqual(PROVIDER.AWS)
    expect(service.type).toEqual(SERVICE_TYPE.MYSQL)
  })

  it('has the AWS regions set', () => {
    expect(new Set(service.regions)).toEqual(new Set(REGIONS))
  })

  it('provides a valid schema', () => {
    const engine: RdsEngine = 'mysql'
    const versions = RDS_MAJOR_VERSIONS_PER_ENGINE[engine]
    const defaultVersion = RDS_DEFAULT_VERSIONS_PER_ENGINE[engine]
    expect(Array.isArray(versions)).toBe(true)
    expect(versions.length).toBeGreaterThan(0)
    expect(typeof defaultVersion === 'string').toBe(true)
    expect(service.schema).toMatchObject(
      getDatabaseSchemaExpectation(SERVICE_TYPE.MYSQL, engine, versions, defaultVersion),
    )
  })

  it('registers the resources on deployment', () => {
    const stack = new Stack('stack-name')
    const config: AwsMySQLAttributes = getAwsDbConfigMock('mysql', 'mysql')
    const provisionable = getAwsProvisionable(config, stack, {
      withRootCredentials: true,
    })

    const resources = service.handler(provisionable, stack)
    expect(typeof resources === 'object').toBe(true)
    expect(resources.dbInstance).toBeInstanceOf(awsDbInstance.DbInstance)
    expect(resources.paramGroup).toBeInstanceOf(awsDbParameterGroup.DbParameterGroup)
  })
})

describe('AWS MariaDB', () => {
  const service = AwsMariaDB

  it('is a valid AWS MySQL service', () => {
    expect(service.provider).toEqual(PROVIDER.AWS)
    expect(service.type).toEqual(SERVICE_TYPE.MARIADB)
  })

  it('has the AWS regions set', () => {
    expect(new Set(service.regions)).toEqual(new Set(REGIONS))
  })

  it('provides a valid schema', () => {
    const engine: RdsEngine = 'mariadb'
    const versions = RDS_MAJOR_VERSIONS_PER_ENGINE[engine]
    const defaultVersion = RDS_DEFAULT_VERSIONS_PER_ENGINE[engine]
    expect(Array.isArray(versions)).toBe(true)
    expect(versions.length).toBeGreaterThan(0)
    expect(typeof defaultVersion === 'string').toBe(true)
    expect(service.schema).toMatchObject(
      getDatabaseSchemaExpectation(SERVICE_TYPE.MARIADB, engine, versions, defaultVersion),
    )
  })

  it('registers the resources on deployment', () => {
    const stack = new Stack('stack-name')
    const config: AwsMariaDBAttributes = getAwsDbConfigMock('mariadb', 'mariadb')
    const provisionable = getAwsProvisionable(config, stack, {
      withRootCredentials: true,
    })

    const resources = service.handler(provisionable, stack)
    expect(typeof resources === 'object').toBe(true)
    expect(resources.dbInstance).toBeInstanceOf(awsDbInstance.DbInstance)
    expect(resources.paramGroup).toBeInstanceOf(awsDbParameterGroup.DbParameterGroup)
  })
})

describe('Database service monitoring', () => {
  it('provides monitoring for the database service', () => {
    const stack = new Stack('stack-name')
    const config: AwsMariaDBAttributes = {
      ...getAwsDbConfigMock('mariadb', 'mariadb'),
      monitoring: {
        emails: [faker.internet.email()],
        urls: [faker.internet.url()],
      },
    }

    const provisionable = getAwsProvisionable<AwsDatabaseProvisionable>(config, stack, {
      withRootCredentials: true,
    })

    resourceHandler(provisionable, stack)
    const synthesized = Testing.synth(stack.context)

    const alarmPrefix = snakeCase(`${config.name}_${stack.name}`)
    expect(synthesized).toHaveResourceWithProperties(snsTopic.SnsTopic, {
      name: expect.stringContaining(snakeCase(config.name)),
    })

    expect(synthesized).toHaveResourceWithProperties(snsTopicPolicy.SnsTopicPolicy, {})

    expect(synthesized).toHaveDataSourceWithProperties(
      dataAwsIamPolicyDocument.DataAwsIamPolicyDocument,
      {},
    )

    expect(synthesized).toHaveResourceWithProperties(dbEventSubscription.DbEventSubscription, {
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

    expect(synthesized).toHaveResourceWithProperties(cloudwatchMetricAlarm.CloudwatchMetricAlarm, {
      alarm_name: expect.stringContaining(`${alarmPrefix}_burst_balance`),
      metric_name: 'BurstBalance',
    })

    expect(synthesized).toHaveResourceWithProperties(cloudwatchMetricAlarm.CloudwatchMetricAlarm, {
      alarm_name: expect.stringContaining(`${alarmPrefix}_cpu_utilization`),
      metric_name: 'CPUUtilization',
    })

    expect(synthesized).toHaveResourceWithProperties(cloudwatchMetricAlarm.CloudwatchMetricAlarm, {
      alarm_name: expect.stringContaining(`${alarmPrefix}_cpu_credit_balance`),
      metric_name: 'CPUCreditBalance',
    })

    expect(synthesized).toHaveResourceWithProperties(cloudwatchMetricAlarm.CloudwatchMetricAlarm, {
      alarm_name: expect.stringContaining(`${alarmPrefix}_disk_depth`),
      metric_name: 'DiskQueueDepth',
    })

    expect(synthesized).toHaveResourceWithProperties(cloudwatchMetricAlarm.CloudwatchMetricAlarm, {
      alarm_name: expect.stringContaining(`${alarmPrefix}_freeable_memory`),
      metric_name: 'FreeableMemory',
    })

    expect(synthesized).toHaveResourceWithProperties(cloudwatchMetricAlarm.CloudwatchMetricAlarm, {
      alarm_name: expect.stringContaining(`${alarmPrefix}_free_storage`),
      metric_name: 'FreeStorageSpace',
    })

    expect(synthesized).toHaveResourceWithProperties(cloudwatchMetricAlarm.CloudwatchMetricAlarm, {
      alarm_name: expect.stringContaining(`${alarmPrefix}_swap_usage`),
      metric_name: 'SwapUsage',
    })
  })
})
