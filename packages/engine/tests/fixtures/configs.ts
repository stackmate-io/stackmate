import { ProjectConfiguration } from '@stackmate/engine';

export const awsMinimalDatabaseState: ProjectConfiguration = {
  name: 'some-project',
  provider: 'aws',
  region: 'eu-central-1',
  state: {
    bucket: 'abc-defg',
  },
  stages: [{
    name: 'production',
    services: [{
      type: 'mysql',
      name: 'mydatabase',
      database: 'mysqldb',
    }],
  }],
};
