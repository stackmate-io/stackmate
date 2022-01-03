import { InternetGateway, Subnet, Vpc } from '@cdktf/provider-aws/lib/vpc';
import 'cdktf/lib/testing/adapters/jest';

import { DEFAULT_RDS_INSTANCE_SIZE } from '@stackmate/clouds/aws/constants';
import { PROVIDER, SERVICE_TYPE } from '@stackmate/constants';
import { awsRegion, awsKeyArn } from 'tests/fixtures';
import { synthesizeProject } from 'tests/helpers';
import { DbInstance, DbParameterGroup } from '@cdktf/provider-aws/lib/rds';

const projectConfig = {
  name: 'database-only-project',
  provider: PROVIDER.AWS,
  region: awsRegion,
  vault: { key: awsKeyArn },
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

describe('Database only project', () => {
  it('provisions the production stage for the project', async () => {
    const { scope } = await synthesizeProject(projectConfig);

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
      db_subnet_group_name: 'db-subnet-mysqlDatabase-production',
      delete_automated_backups: false,
      deletion_protection: true,
      engine: 'mysql',
      engine_version: '8.0',
      identifier: 'mysqlDatabase-production',
      instance_class: 'db.t3.micro',
      port: 3306,
      publicly_accessible: true,
      skip_final_snapshot: false,
      storage_type: 'gp2',
    });
  });
});
