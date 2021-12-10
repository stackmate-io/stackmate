import os from 'os';
import faker from 'faker';
import { join as joinPaths } from 'path';

import { ProjectConfiguration } from '../src/types';
import { SERVICE_TYPE } from '../src/constants';
import { AWS_REGIONS, RDS_INSTANCE_SIZES, RDS_MYSQL_ENGINES } from '../src/clouds/aws/constants'

export const stackName = `test-stack-${faker.random.alphaNumeric(12)}`
export const outputPath = joinPaths(os.tmpdir(), faker.datatype.hexaDecimal(12));
export const awsRegion = faker.random.arrayElement(Object.values(AWS_REGIONS)) as string;

export const mysqlDatabaseConfiguration = {
  nodes: 1,
  type: SERVICE_TYPE.DATABASE,
  name: faker.internet.domainWord(),
  region: awsRegion,
  size: faker.random.arrayElement(RDS_INSTANCE_SIZES),
  storage: faker.datatype.number({ min: 30, max: 100 }),
  engine: faker.random.arrayElement(RDS_MYSQL_ENGINES),
  database: 'my_database_name',
  credentials: {
    username: faker.internet.userName(),
    password: faker.internet.password(),
  },
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
