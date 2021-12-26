import 'cdktf/lib/testing/adapters/jest';
import { DbInstance, DbParameterGroup } from '@cdktf/provider-aws/lib/rds';
import { Testing } from 'cdktf';

import { CloudPrerequisites } from '@stackmate/types';
import { CloudStack } from '@stackmate/interfaces';
import { PROVIDER, SERVICE_TYPE } from '@stackmate/constants';
import { getAwsPrerequisites, getMockStack } from 'tests/mocks';
import { enhanceStack } from 'tests/helpers';
import { mysqlDatabaseConfiguration as serviceConfig } from 'tests/fixtures';
import { AwsRdsService } from '@stackmate/clouds/aws';
import Profile from '@stackmate/core/profile';

describe('AwsRdsService', () => {
  let mockStack: CloudStack;
  let prerequisites: CloudPrerequisites;

  beforeEach(() => {
    prerequisites = getAwsPrerequisites({ stack: mockStack });
  });

  describe('instantiation', () => {
    let service: AwsRdsService;

    beforeEach(() => {
      mockStack = getMockStack();
    });

    it('instantiates the service and assigns the attributes correctly', () => {
      const {
        name, region, size, storage, engine, database, rootCredentials,
      } = serviceConfig;

      service = AwsRdsService.factory(serviceConfig, mockStack, prerequisites);

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
      expect(service.links).toEqual([]);
      expect(service.profile).toEqual(Profile.DEFAULT);
      expect(service.overrides).toEqual({});
    });

    it('returns the attribute names', () => {
      service = AwsRdsService.factory(serviceConfig, mockStack, prerequisites);
      expect(new Set(service.attributeNames)).toEqual(new Set([
        'size', 'storage', 'version', 'database', 'nodes', 'rootCredentials',
        'engine', 'port', 'name', 'region', 'links', 'profile', 'overrides',
      ]));
    });
  });

  describe('provision', () => {
    it('provisions a single-node RDS instance with the default profile', () => {
      let cloudStack: CloudStack;
      let variables = {};
      const stackName: string = 'production';

      const scope = Testing.synthScope((stack) => {
        cloudStack = enhanceStack(stack, { name: stackName });
        const service = AwsRdsService.factory(serviceConfig, cloudStack, prerequisites);

        expect(service.isProvisioned).toBeTruthy();
        ({ variable: variables } = cloudStack.toTerraform());
      });

      expect(scope).toHaveResourceWithProperties(DbParameterGroup, {
        family: 'mysql8.0',
      });

      expect(variables).toMatchObject({
        [`${stackName}-${serviceConfig.name}-rootusername`]: {
          default: serviceConfig.rootCredentials.username,
          sensitive: true,
        },
        [`${stackName}-${serviceConfig.name}-rootpassword`]: {
          default: serviceConfig.rootCredentials.password,
          sensitive: true,
        },
      });

      expect(scope).toHaveResourceWithProperties(DbInstance, {
        allocated_storage: serviceConfig.storage,
        allow_major_version_upgrade: false,
        apply_immediately: true,
        auto_minor_version_upgrade: true,
        backup_retention_period: 0,
        copy_tags_to_snapshot: true,
        count: 1,
        db_subnet_group_name: `db-subnet-${serviceConfig.name}-${stackName}`,
        delete_automated_backups: true,
        deletion_protection: false,
        enabled_cloudwatch_logs_exports: ['error'],
        engine: serviceConfig.engine,
        engine_version: serviceConfig.version,
        identifier: serviceConfig.name,
        instance_class: serviceConfig.size,
        multi_az: false,
        name: serviceConfig.database,
        port: 3306,
        publicly_accessible: true,
        skip_final_snapshot: true,
        storage_type: 'gp2',
        parameter_group_name: `$\{aws_db_parameter_group.${serviceConfig.name}-${stackName}-params.name}`,
        password: `$\{var.${stackName}-${serviceConfig.name}-rootpassword}`,
        username: `$\{var.${stackName}-${serviceConfig.name}-rootusername}`,
      });
    });
  });
});
