import faker from 'faker';

import { ProjectConfiguration } from '@stackmate/types';
import { SERVICE_TYPE } from '@stackmate/constants';
import { AWS_REGIONS, RDS_INSTANCE_SIZES } from '@stackmate/providers/aws/constants';

export const appName = `test-app-${faker.random.alphaNumeric(6)}`;
export const stackName = `test-stack-${faker.random.alphaNumeric(12)}`;
export const awsRegion = faker.random.arrayElement(Object.values(AWS_REGIONS)) as string;
export const awsKeyArn = `arn:aws:kms:${awsRegion}:111122223333:key/1234abcd-12ab-34cd-56ef-1234567890ab`;

export const networkingConfiguration = {
  name: `${faker.internet.domainWord()}-vpc`,
  region: awsRegion,
  ip: '12.0.0.0',
};

export const mysqlDatabaseConfiguration = {
  name: `${faker.internet.domainWord()}-mysql-database`,
  region: awsRegion,
  nodes: 1,
  type: SERVICE_TYPE.DATABASE,
  size: faker.random.arrayElement(RDS_INSTANCE_SIZES),
  storage: faker.datatype.number({ min: 30, max: 100 }),
  engine: 'mysql',
  version: '8.0',
  port: 3306,
  database: 'my_database_name',
  rootCredentials: {
    username: faker.internet.userName(),
    password: faker.internet.password(),
  },
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
