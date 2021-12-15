import 'cdktf/lib/testing/adapters/jest';
import { Testing } from 'cdktf';

import { CloudPrerequisites, DatabaseServiceAttributes } from '@stackmate/types';
import { CloudStack } from '@stackmate/interfaces';
import { AwsRdsService } from '@stackmate/clouds/aws';
import { PROVIDER, SERVICE_TYPE } from '@stackmate/constants';
import { mysqlDatabaseConfiguration } from 'tests/fixtures';
import { getAwsPrerequisites, getMockStack } from 'tests/mocks';
import { enhanceStack } from 'tests/helpers';
import { DbInstance, DbParameterGroup } from '@cdktf/provider-aws/lib/rds';

describe('AwsRdsService', () => {
  let mockStack: CloudStack;
  let prerequisites: CloudPrerequisites;
  let databaseConfig: DatabaseServiceAttributes;

  beforeEach(() => {
    databaseConfig = mysqlDatabaseConfiguration;
    prerequisites = getAwsPrerequisites({ stack: mockStack });
  });

  describe('populate', () => {
    let service: AwsRdsService;

    beforeEach(() => {
      mockStack = getMockStack();
      service = new AwsRdsService(mockStack, prerequisites);
    });

    it('instantiates the service and assigns the attributes correctly', () => {
      const { name, region, size, storage, engine, database, rootCredentials } = databaseConfig;
      service.populate(databaseConfig);

      expect(service.provider).toEqual(PROVIDER.AWS);
      expect(service.type).toEqual(SERVICE_TYPE.DATABASE);
      expect(service.name).toEqual(name);
      expect(service.region).toEqual(region);
      expect(service.size).toEqual(size);
      expect(service.storage).toEqual(storage);
      expect(service.engine).toEqual(engine);
      expect(service.database).toEqual(database);
      expect(service.stage).toEqual(mockStack.name);
      expect(service.rootCredentials).toEqual(rootCredentials);
    });
  });

  describe('provision', () => {
    it('provisions a single-node RDS instance with the default profile', () => {
      let cloudStack: CloudStack;
      let stackName: string = 'production';
      let variables = {};

      const scope = Testing.synthScope((stack) => {
        cloudStack = enhanceStack(stack, { name: stackName });
        new AwsRdsService(cloudStack, prerequisites).populate(databaseConfig);
        ({ variable: variables } = cloudStack.toTerraform());
      });

      expect(scope).toHaveResourceWithProperties(DbParameterGroup, {
        family: 'mysql8.0',
      });

      expect(variables).toMatchObject({
        [`${stackName}-${databaseConfig.name}-rootusername`]: {
          default: databaseConfig.rootCredentials.username,
          sensitive: true,
        },
        [`${stackName}-${databaseConfig.name}-rootpassword`]: {
          default: databaseConfig.rootCredentials.password,
          sensitive: true,
        }
      });

      expect(scope).toHaveResourceWithProperties(DbInstance, {
        allocated_storage: databaseConfig.storage,
        allow_major_version_upgrade: false,
        apply_immediately: true,
        auto_minor_version_upgrade: true,
        backup_retention_period: 0,
        copy_tags_to_snapshot: true,
        count: 1,
        db_subnet_group_name: `db-subnet-${databaseConfig.name}-${stackName}`,
        delete_automated_backups: true,
        deletion_protection: false,
        enabled_cloudwatch_logs_exports: ['error'],
        engine: databaseConfig.engine,
        engine_version: databaseConfig.version,
        identifier: databaseConfig.name,
        instance_class: databaseConfig.size,
        multi_az: false,
        name: databaseConfig.database,
        port: 3306,
        publicly_accessible: true,
        skip_final_snapshot: true,
        storage_type: 'gp2',
        parameter_group_name: `\$\{aws_db_parameter_group.${databaseConfig.name}-${stackName}-params.name\}`,
        password: `\$\{var.${stackName}-${databaseConfig.name}-rootpassword}`,
        username: `\$\{var.${stackName}-${databaseConfig.name}-rootusername}`,
      });
    });
  });
});
