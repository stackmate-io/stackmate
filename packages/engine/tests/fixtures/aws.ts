import { faker } from '@faker-js/faker';

import { ProjectConfiguration } from '@stackmate/engine/types';
import { PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';
import { AWS_REGIONS, RDS_INSTANCE_SIZES } from '@stackmate/engine/providers/aws/constants';

export const awsRegion = faker.helpers.arrayElement(Object.values(AWS_REGIONS)) as string;
export const awsKeyArn = `arn:aws:kms:${awsRegion}:111122223333:key/1234abcd-12ab-34cd-56ef-1234567890ab`;

export const awsProviderConfiguration = {
  name: `provider-${PROVIDER.AWS}-default`,
  provider: PROVIDER.AWS,
  region: awsRegion,
};

export const awsVaultConfiguration = {
  provider: PROVIDER.AWS,
  region: awsRegion,
};

export const stateConfiguration = {
  provider: PROVIDER.AWS,
  bucket: faker.internet.domainWord(),
  region: awsRegion,
};

export const mysqlDatabaseConfiguration = {
  provider: PROVIDER.AWS,
  name: 'aws-rds-mysql-database',
  region: awsRegion,
  nodes: 1,
  type: SERVICE_TYPE.MYSQL,
  size: faker.helpers.arrayElement(RDS_INSTANCE_SIZES),
  storage: faker.datatype.number({ min: 30, max: 100 }),
  version: '8.0',
  port: 3306,
  profile: 'production',
  database: 'my_database_name',
};

export const fullConfig: ProjectConfiguration = {
  name: 'full-config',
  provider: 'aws',
  region: 'eu-central-1',
  stages: [{
    name: 'production',
    services: [mysqlDatabaseConfiguration],
  }],
};
