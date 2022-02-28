import { Testing } from 'cdktf';
import { InternetGateway, Subnet, Vpc } from '@cdktf/provider-aws/lib/vpc';
import 'cdktf/lib/testing/adapters/jest';

import { deployProject } from 'tests/helpers';
import { PROVIDER, SERVICE_TYPE } from '@stackmate/constants';
import { DEFAULT_RDS_INSTANCE_SIZE } from '@stackmate/providers/aws/constants';
import { awsRegion, awsKeyArn } from 'tests/fixtures';
import { DbInstance, DbParameterGroup } from '@cdktf/provider-aws/lib/rds';

const projectConfig = {
  name: 'database-only-project',
  provider: PROVIDER.AWS,
  region: awsRegion,
  secrets: {
    provider: PROVIDER.AWS,
    key: awsKeyArn,
  },
  stages: {
    production: {
      mysqlDatabase: {
        type: SERVICE_TYPE.DATABASE,
        size: DEFAULT_RDS_INSTANCE_SIZE,
        profile: 'production',
        storage: 30,
        version: '8.0',
        engine: 'mysql',
        port: 3306,
      },
    },
  },
};

describe.only('Database only project', () => {
  it('registers the production stage for the project', async () => {
    const { scope, stack } = await deployProject(projectConfig);

    expect(Testing.fullSynth(stack)).toBeValidTerraform();

    expect(scope).toHaveResourceWithProperties(Vpc, {
      cidr_block: '10.0.0.0/16',
      enable_dns_hostnames: true,
      enable_dns_support: true,
    });

    expect(scope).toHaveResourceWithProperties(Subnet, {
      cidr_block: '10.0.1.0/24',
      map_public_ip_on_launch: true,
    });

    expect(scope).toHaveResource(InternetGateway);

    expect(scope).toHaveResourceWithProperties(DbParameterGroup, {
      family: 'mysql8.0',
    });

    expect(scope).toHaveResourceWithProperties(DbInstance, {
      allocated_storage: 30,
      allow_major_version_upgrade: false,
      apply_immediately: true,
      auto_minor_version_upgrade: false,
      backup_retention_period: 30,
      copy_tags_to_snapshot: true,
      db_subnet_group_name: 'db-subnet-mysqldatabase-production',
      delete_automated_backups: false,
      deletion_protection: true,
      engine: 'mysql',
      engine_version: '8.0',
      identifier: 'mysqldatabase-production',
      instance_class: 'db.t3.micro',
      port: 3306,
      publicly_accessible: true,
      skip_final_snapshot: false,
      storage_type: 'gp2',
    });
  });
});
