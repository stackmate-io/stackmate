import 'cdktf/lib/testing/adapters/jest';
import { snakeCase } from 'lodash';
import { DbInstance, DbParameterGroup } from '@cdktf/provider-aws/lib/rds';

import Profile from '@stackmate/core/profile';
import { PROVIDER, SERVICE_TYPE } from '@stackmate/constants';
import { getServiceRegisterationResults } from 'tests/helpers';
import { mysqlDatabaseConfiguration as serviceConfig, stageName, projectName } from 'tests/fixtures';
import { Database as AwsRdsService } from '@stackmate/providers/aws';

describe('AwsRdsService', () => {
  describe('instantiation', () => {
    let service: AwsRdsService;

    it('instantiates the service and assigns the attributes correctly', () => {
      const { name, region, size, storage, engine, database } = serviceConfig;

      service = AwsRdsService.factory(serviceConfig);

      expect(service.provider).toEqual(PROVIDER.AWS);
      expect(service.type).toEqual(SERVICE_TYPE.DATABASE);
      expect(service.name).toEqual(name);
      expect(service.region).toEqual(region);
      expect(service.size).toEqual(size);
      expect(service.storage).toEqual(storage);
      expect(service.engine).toEqual(engine);
      expect(service.database).toEqual(database);
      expect(service.links).toEqual([]);
      expect(service.profile).toEqual(Profile.DEFAULT);
      expect(service.overrides).toEqual({});
      expect(service.identifier).toEqual(`${name}-${stageName}`.toLowerCase());
    });

    it('returns the attribute names', () => {
      service = AwsRdsService.factory(serviceConfig);
      expect(new Set(service.attributeNames)).toEqual(new Set([
        'size', 'storage', 'version', 'database', 'nodes',
        'profile', 'overrides', 'projectName', 'stageName',
        'engine', 'port', 'name', 'region', 'links',
      ]));
    });
  });

  describe('register', () => {
    it('registers a single-node RDS instance with the default profile', async () => {
      const { AWS: provider } = PROVIDER;
      const { scope } = await getServiceRegisterationResults({
        provider,
        serviceClass: AwsRdsService,
        serviceConfig,
        stageName,
        projectName,
      });

      expect(scope).toHaveResourceWithProperties(DbParameterGroup, {
        family: 'mysql8.0',
      });

      expect(scope).toHaveResourceWithProperties(DbInstance, {
        allocated_storage: serviceConfig.storage,
        allow_major_version_upgrade: false,
        apply_immediately: true,
        auto_minor_version_upgrade: true,
        backup_retention_period: 0,
        copy_tags_to_snapshot: true,
        count: 1,
        delete_automated_backups: true,
        deletion_protection: false,
        engine: serviceConfig.engine,
        engine_version: serviceConfig.version,
        identifier: `${serviceConfig.name}-${stageName}`,
        instance_class: serviceConfig.size,
        multi_az: false,
        name: serviceConfig.database,
        db_subnet_group_name: `db-subnet-${serviceConfig.name}-${stageName}`,
        parameter_group_name: `$\{aws_db_parameter_group.${serviceConfig.name}-${stageName}-params.name}`,
        provider: `${provider}.${provider}_${snakeCase(serviceConfig.region)}`,
        port: 3306,
        publicly_accessible: false,
        skip_final_snapshot: true,
        storage_type: 'gp2',
        /** @todo */
        // https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/db_instance#enabled_cloudwatch_logs_exports
        enabled_cloudwatch_logs_exports: ['error'],
        username: 'richard',
        password: 'abc123',
      });
    });
  });
});
