import { faker } from '@faker-js/faker';
import { kebabCase, snakeCase } from 'lodash';
import { Testing } from 'cdktf';
import {
  cloudwatchMetricAlarm,
  dataAwsIamPolicyDocument,
  dbEventSubscription,
  dbInstance as awsDbInstance,
  dbParameterGroup as awsDbParameterGroup,
  snsTopic,
  snsTopicPolicy,
} from '@cdktf/provider-aws';

import { getStack } from '@core/stack';
import { getAwsDeploymentProvisionableMock } from '@tests/mocks/aws';
import { ServiceTypeChoice } from '@core/service'
import { PROVIDER, SERVICE_TYPE } from '@constants';
import { DEFAULT_PROFILE_NAME, DEFAULT_SERVICE_STORAGE } from '@constants';
import {
  AwsDatabaseAttributes, AWSMariaDB, AwsMariaDBAttributes, AWSMySQL, AwsMySQLAttributes,
  AWSPostgreSQL, AwsPostgreSQLAttributes, onDeploy, AwsDatabaseDeployableProvisionable,
} from '@providers/aws/services/database';
import {
  RdsEngine, DEFAULT_RDS_INSTANCE_SIZE, DEFAULT_REGION, RDS_INSTANCE_SIZES,
  REGIONS, RDS_MAJOR_VERSIONS_PER_ENGINE, RDS_DEFAULT_VERSIONS_PER_ENGINE,
} from '@providers/aws/constants';

const getDatabaseSchemaExpectation = (
  type: ServiceTypeChoice, engine: RdsEngine, versions: readonly string[], defaultVersion: string,
) => ({
  $id: `services/aws/${type}`,
  type: 'object',
  required: ['name', 'type'],
  additionalProperties: false,
  properties: {
    provider: { type: 'string', enum: [PROVIDER.AWS], default: PROVIDER.AWS },
    type: { type: 'string', enum: [type], default: type },
    region: { type: 'string', enum: Array.from(REGIONS), default: DEFAULT_REGION },
    name: { type: 'string', pattern: expect.stringContaining('a-zA-Z0-9') },
    version: { type: 'string', enum: Array.from(versions), default: defaultVersion },
    engine: { type: 'string', enum: [engine], default: engine },
    nodes: { type: 'number', minimum: 1, maximum: 10000, default: 1 },
    profile: { type: 'string', default: DEFAULT_PROFILE_NAME, serviceProfile: true },
    overrides: { type: 'object', default: {}, serviceProfileOverrides: true },
    database: { type: 'string', pattern: expect.stringContaining('a-zA-Z0-9') },
    storage: {
      type: 'number', minimum: 1, maximum: 100000, default: DEFAULT_SERVICE_STORAGE,
    },
    size: {
      type: 'string', enum: Array.from(RDS_INSTANCE_SIZES), default: DEFAULT_RDS_INSTANCE_SIZE,
    },
  },
});

const getDatabaseConfig = <T extends ServiceTypeChoice, E extends RdsEngine>(
  type: T, engine: E,
): AwsDatabaseAttributes<T, E> => ({
  provider: PROVIDER.AWS,
  type,
  engine,
  name: 'my-awesome-rds-database-service',
  database: 'some-database-name',
  nodes: 1,
  profile: DEFAULT_PROFILE_NAME,
  overrides: {},
  links: [],
  externalLinks: [],
  monitoring: { emails: [], urls: [] },
  port: faker.datatype.number({ min: 2000, max: 65000 }),
  region: faker.helpers.arrayElement(REGIONS),
  size: faker.helpers.arrayElement(RDS_INSTANCE_SIZES),
  storage: faker.datatype.number({ min: 30, max: 900 }),
  version: faker.helpers.arrayElement(RDS_MAJOR_VERSIONS_PER_ENGINE[engine]),
});

describe('AWS PostgreSQL', () => {
  const service = AWSPostgreSQL;

  it('is a valid AWS PostgreSQL service', () => {
    expect(service.provider).toEqual(PROVIDER.AWS);
    expect(service.type).toEqual(SERVICE_TYPE.POSTGRESQL);
  });

  it('has the AWS regions set', () => {
    expect(new Set(service.regions)).toEqual(new Set(REGIONS));
  });

  it('has the handlers registered', () => {
    expect(service.handlers.get('deployable')).toEqual(onDeploy);
    expect(service.handlers.get('preparable')).toBeUndefined();
    expect(service.handlers.get('destroyable')).toBeUndefined();
  });

  it('provides a valid schema', () => {
    const engine: RdsEngine = 'postgres';
    const versions = RDS_MAJOR_VERSIONS_PER_ENGINE[engine];
    const defaultVersion = RDS_DEFAULT_VERSIONS_PER_ENGINE[engine];
    expect(Array.isArray(versions)).toBe(true);
    expect(versions.length).toBeGreaterThan(0);
    expect(typeof defaultVersion === 'string').toBe(true);
    expect(service.schema).toMatchObject(
      getDatabaseSchemaExpectation(SERVICE_TYPE.POSTGRESQL, engine, versions, defaultVersion),
    );
  });

  it('registers the resources on deployment', () => {
    const stack = getStack('some-project', 'some-stage');
    const config: AwsPostgreSQLAttributes = getDatabaseConfig('postgresql', 'postgres');
    const provisionable = getAwsDeploymentProvisionableMock<AwsDatabaseDeployableProvisionable>(
      config, stack, { withRootCredentials: true },
    );

    const resources = onDeploy(provisionable, stack);
    expect(typeof resources === 'object').toBe(true);
    expect(resources.dbInstance).toBeInstanceOf(awsDbInstance.DbInstance);
    expect(resources.paramGroup).toBeInstanceOf(awsDbParameterGroup.DbParameterGroup);

    const synthesized = Testing.synth(stack.context);

    expect(synthesized).toHaveResourceWithProperties(awsDbInstance.DbInstance, {
      engine: config.engine,
      instance_class: config.size,
      port: config.port,
      allocated_storage: config.storage,
      db_name: config.database,
      identifier: kebabCase(`${config.name}-${stack.stageName}`),
    });

    expect(synthesized).toHaveResourceWithProperties(awsDbParameterGroup.DbParameterGroup, {
      family: expect.stringContaining('postgres'),
    });
  });
});

describe('AWS MySQL', () => {
  const service = AWSMySQL;

  it('is a valid AWS MySQL service', () => {
    expect(service.provider).toEqual(PROVIDER.AWS);
    expect(service.type).toEqual(SERVICE_TYPE.MYSQL);
  });

  it('has the AWS regions set', () => {
    expect(new Set(service.regions)).toEqual(new Set(REGIONS));
  });

  it('has the handlers registered', () => {
    expect(service.handlers.get('deployable')).toEqual(onDeploy);
    expect(service.handlers.get('preparable')).toBeUndefined();
    expect(service.handlers.get('destroyable')).toBeUndefined();
  });

  it('provides a valid schema', () => {
    const engine: RdsEngine = 'mysql';
    const versions = RDS_MAJOR_VERSIONS_PER_ENGINE[engine];
    const defaultVersion = RDS_DEFAULT_VERSIONS_PER_ENGINE[engine];
    expect(Array.isArray(versions)).toBe(true);
    expect(versions.length).toBeGreaterThan(0);
    expect(typeof defaultVersion === 'string').toBe(true);
    expect(service.schema).toMatchObject(
      getDatabaseSchemaExpectation(SERVICE_TYPE.MYSQL, engine, versions, defaultVersion),
    );
  });

  it('registers the resources on deployment', () => {
    const stack = getStack('some-project', 'some-stage');
    const config: AwsMySQLAttributes = getDatabaseConfig('mysql', 'mysql');
    const provisionable = getAwsDeploymentProvisionableMock<AwsDatabaseDeployableProvisionable>(
      config, stack, { withRootCredentials: true },
    );

    const resources = onDeploy(provisionable, stack);
    expect(typeof resources === 'object').toBe(true);
    expect(resources.dbInstance).toBeInstanceOf(awsDbInstance.DbInstance);
    expect(resources.paramGroup).toBeInstanceOf(awsDbParameterGroup.DbParameterGroup);

    const synthesized = Testing.synth(stack.context);
    expect(synthesized).toHaveResourceWithProperties(awsDbInstance.DbInstance, {
      engine: config.engine,
      instance_class: config.size,
      port: config.port,
      allocated_storage: config.storage,
      db_name: config.database,
      identifier: kebabCase(`${config.name}-${stack.stageName}`),
    });

    expect(synthesized).toHaveResourceWithProperties(awsDbParameterGroup.DbParameterGroup, {
      family: expect.stringContaining('mysql'),
    });
  });
});

describe('AWS MariaDB', () => {
  const service = AWSMariaDB;

  it('is a valid AWS MySQL service', () => {
    expect(service.provider).toEqual(PROVIDER.AWS);
    expect(service.type).toEqual(SERVICE_TYPE.MARIADB);
  });

  it('has the AWS regions set', () => {
    expect(new Set(service.regions)).toEqual(new Set(REGIONS));
  });

  it('has the handlers registered', () => {
    expect(service.handlers.get('deployable')).toEqual(onDeploy);
    expect(service.handlers.get('preparable')).toBeUndefined();
    expect(service.handlers.get('destroyable')).toBeUndefined();
  });

  it('provides a valid schema', () => {
    const engine: RdsEngine = 'mariadb';
    const versions = RDS_MAJOR_VERSIONS_PER_ENGINE[engine];
    const defaultVersion = RDS_DEFAULT_VERSIONS_PER_ENGINE[engine];
    expect(Array.isArray(versions)).toBe(true);
    expect(versions.length).toBeGreaterThan(0);
    expect(typeof defaultVersion === 'string').toBe(true);
    expect(service.schema).toMatchObject(
      getDatabaseSchemaExpectation(SERVICE_TYPE.MARIADB, engine, versions, defaultVersion),
    );
  });

  it('registers the resources on deployment', () => {
    const stack = getStack('some-project', 'some-stage');
    const config: AwsMariaDBAttributes = getDatabaseConfig('mariadb', 'mariadb');
    const provisionable = getAwsDeploymentProvisionableMock<AwsDatabaseDeployableProvisionable>(
      config, stack, { withRootCredentials: true },
    );

    const resources = onDeploy(provisionable, stack);
    expect(typeof resources === 'object').toBe(true);
    expect(resources.dbInstance).toBeInstanceOf(awsDbInstance.DbInstance);
    expect(resources.paramGroup).toBeInstanceOf(awsDbParameterGroup.DbParameterGroup);

    const synthesized = Testing.synth(stack.context);
    expect(synthesized).toHaveResourceWithProperties(awsDbInstance.DbInstance, {
      engine: config.engine,
      instance_class: config.size,
      port: config.port,
      allocated_storage: config.storage,
      db_name: config.database,
      identifier: kebabCase(`${config.name}-${stack.stageName}`),
    });

    expect(synthesized).toHaveResourceWithProperties(awsDbParameterGroup.DbParameterGroup, {
      family: expect.stringContaining('mariadb'),
    });
  });
});

describe('Database service monitoring', () => {
  it('provides monitoring for the database service', () => {
    const stack = getStack('some-project', 'some-stage');
    const config: AwsMariaDBAttributes = {
      ...getDatabaseConfig('mariadb', 'mariadb'),
      monitoring: {
        emails: [faker.internet.email()],
        urls: [faker.internet.url()],
      },
    };

    const provisionable = getAwsDeploymentProvisionableMock<AwsDatabaseDeployableProvisionable>(
      config, stack, { withRootCredentials: true },
    );

    onDeploy(provisionable, stack);
    const synthesized = Testing.synth(stack.context);

    const alarmPrefix = snakeCase(`${config.name}_${stack.stageName}`);
    expect(synthesized).toHaveResourceWithProperties(snsTopic.SnsTopic, {
      name: expect.stringContaining(snakeCase(config.name)),
    });

    expect(synthesized).toHaveResourceWithProperties(snsTopicPolicy.SnsTopicPolicy, {});

    expect(synthesized).toHaveDataSourceWithProperties(
      dataAwsIamPolicyDocument.DataAwsIamPolicyDocument, {},
    );

    expect(synthesized).toHaveResourceWithProperties(dbEventSubscription.DbEventSubscription, {
      name: expect.stringContaining(`${alarmPrefix}_event_subscription`),
      source_type: 'db-instance',
      event_categories: [
        'failover', 'failure', 'low storage', 'maintenance', 'notification', 'recovery',
      ],
    });

    expect(synthesized).toHaveResourceWithProperties(cloudwatchMetricAlarm.CloudwatchMetricAlarm, {
      alarm_name: expect.stringContaining(`${alarmPrefix}_burst_balance`),
      metric_name: 'BurstBalance',
    });

    expect(synthesized).toHaveResourceWithProperties(cloudwatchMetricAlarm.CloudwatchMetricAlarm, {
      alarm_name: expect.stringContaining(`${alarmPrefix}_cpu_utilization`),
      metric_name: 'CPUUtilization',
    });

    expect(synthesized).toHaveResourceWithProperties(cloudwatchMetricAlarm.CloudwatchMetricAlarm, {
      alarm_name: expect.stringContaining(`${alarmPrefix}_cpu_credit_balance`),
      metric_name: 'CPUCreditBalance',
    });

    expect(synthesized).toHaveResourceWithProperties(cloudwatchMetricAlarm.CloudwatchMetricAlarm, {
      alarm_name: expect.stringContaining(`${alarmPrefix}_disk_depth`),
      metric_name: 'DiskQueueDepth',
    });

    expect(synthesized).toHaveResourceWithProperties(cloudwatchMetricAlarm.CloudwatchMetricAlarm, {
      alarm_name: expect.stringContaining(`${alarmPrefix}_freeable_memory`),
      metric_name: 'FreeableMemory',
    });

    expect(synthesized).toHaveResourceWithProperties(cloudwatchMetricAlarm.CloudwatchMetricAlarm, {
      alarm_name: expect.stringContaining(`${alarmPrefix}_free_storage`),
      metric_name: 'FreeStorageSpace',
    });

    expect(synthesized).toHaveResourceWithProperties(cloudwatchMetricAlarm.CloudwatchMetricAlarm, {
      alarm_name: expect.stringContaining(`${alarmPrefix}_swap_usage`),
      metric_name: 'SwapUsage',
    });
  });
});
