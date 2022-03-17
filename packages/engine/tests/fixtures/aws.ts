import faker from 'faker';

import { ProjectConfiguration } from '@stackmate/engine/types';
import { PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';
import { AWS_REGIONS, RDS_INSTANCE_SIZES } from '@stackmate/engine/providers/aws/constants';
import { projectName, stageName } from 'tests/fixtures/generic';

export const awsRegion = faker.random.arrayElement(Object.values(AWS_REGIONS)) as string;
export const awsKeyArn = `arn:aws:kms:${awsRegion}:111122223333:key/1234abcd-12ab-34cd-56ef-1234567890ab`;

export const awsProviderConfiguration = {
  type: SERVICE_TYPE.PROVIDER,
  name: `provider-${PROVIDER.AWS}-default`,
  provider: PROVIDER.AWS,
  region: awsRegion,
  projectName,
  stageName,
};

export const awsVaultConfiguration = {
  type: SERVICE_TYPE.VAULT,
  name: `project-vault-${PROVIDER.AWS}`,
  provider: PROVIDER.AWS,
  region: awsRegion,
  projectName,
  stageName,
};

export const stateConfiguration = {
  provider: PROVIDER.AWS,
  type: SERVICE_TYPE.STATE,
  name: 'aws-state-state',
  bucket: faker.internet.domainWord(),
  region: awsRegion,
  projectName,
  stageName,
};

export const mysqlDatabaseConfiguration = {
  provider: PROVIDER.AWS,
  name: 'aws-rds-mysql-database',
  region: awsRegion,
  nodes: 1,
  type: SERVICE_TYPE.DATABASE,
  size: faker.random.arrayElement(RDS_INSTANCE_SIZES),
  storage: faker.datatype.number({ min: 30, max: 100 }),
  engine: 'mysql',
  version: '8.0',
  port: 3306,
  database: 'my_database_name',
  projectName,
  stageName,
};

export const fullConfig: ProjectConfiguration = {
  name: 'full-config',
  provider: 'aws',
  region: 'eu-central-1',
  stages: {
    production: {
      mysqlDatabase: mysqlDatabaseConfiguration,
    },
  },
  defaults: {
    aws: {
      'vpc-cidr': '12.0.0.1',
      'vpc-prefix': 'my-vpc-prefix',
    },
  },
};
