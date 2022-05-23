import 'cdktf/lib/testing/adapters/jest';
import { kebabCase, snakeCase } from 'lodash';
import { DbInstance, DbParameterGroup } from '@cdktf/provider-aws/lib/rds';
import { SecretsmanagerSecret, SecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/secretsmanager';

import Profile from '@stackmate/engine/core/profile';
import { PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';
import { getServiceRegisterationResults } from 'tests/helpers';
import { mysqlDatabaseConfiguration as serviceConfig } from 'tests/fixtures/aws';
import { MySQL as AwsRdsService } from '@stackmate/engine/providers/aws';

describe('AwsRdsService', () => {
  describe('instantiation', () => {
    let service: AwsRdsService;

    it('instantiates the service and assigns the attributes correctly', () => {
      const { name, region, size, storage, database, stageName } = serviceConfig;

      service = AwsRdsService.factory<AwsRdsService>(serviceConfig);

      expect(service.provider).toEqual(PROVIDER.AWS);
      expect(service.type).toEqual(SERVICE_TYPE.MYSQL);
      expect(service.name).toEqual(name);
      expect(service.region).toEqual(region);
      expect(service.size).toEqual(size);
      expect(service.storage).toEqual(storage);
      expect(service.engine).toEqual('mysql');
      expect(service.database).toEqual(database);
      expect(service.links).toEqual([]);
      expect(service.profile).toEqual(Profile.DEFAULT);
      expect(service.overrides).toEqual({});
      expect(service.identifier).toEqual(`${name}-${stageName}`.toLowerCase());
    });
  });

  describe('register', () => {
    it('registers a single-node RDS instance with the default profile', async () => {
      const { AWS: provider } = PROVIDER;
      const { stageName, projectName } = serviceConfig;
      const { scope } = await getServiceRegisterationResults({ serviceConfig });
      const providerAlias = `${provider}.${provider}_${snakeCase(serviceConfig.region)}`;

      expect(scope).toHaveResourceWithProperties(DbParameterGroup, {
        family: 'mysql8.0',
      });

      expect(scope).toHaveResourceWithProperties(SecretsmanagerSecret, {
        description: `Secrets for the ${serviceConfig.name} service`,
        name: `/${projectName}/${stageName}/${kebabCase(serviceConfig.name)}`,
        provider: providerAlias,
        recovery_window_in_days: 30,
      });

      expect(scope).toHaveResourceWithProperties(SecretsmanagerSecretVersion, {
        secret_id: `\${aws_secretsmanager_secret.${snakeCase(serviceConfig.name)}_secrets_secret.id}`,
        lifecycle: {
          ignore_changes: ['secret_string'],
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
        delete_automated_backups: true,
        deletion_protection: false,
        engine: 'mysql',
        engine_version: '8.0',
        identifier: `${serviceConfig.name}-${stageName}`,
        instance_class: serviceConfig.size,
        multi_az: false,
        name: serviceConfig.database,
        db_subnet_group_name: `db-subnet-${serviceConfig.name}-${stageName}`,
        parameter_group_name: `$\{aws_db_parameter_group.${serviceConfig.name}-${stageName}-params.name}`,
        provider: providerAlias,
        port: 3306,
        publicly_accessible: false,
        skip_final_snapshot: true,
        storage_type: 'gp2',
        username: `\${lookup(jsondecode(data.aws_secretsmanager_secret_version.${snakeCase(serviceConfig.name)}_secrets_data.secret_string), "username", "")}`,
        password: `\${lookup(jsondecode(data.aws_secretsmanager_secret_version.${snakeCase(serviceConfig.name)}_secrets_data.secret_string), "password", "")}`,
        enabled_cloudwatch_logs_exports: ['audit', 'error', 'general', 'slowquery'],
        lifecycle: {
          create_before_destroy: true,
        },
      });
    });
  });
});
