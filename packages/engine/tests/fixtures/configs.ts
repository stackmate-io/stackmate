import { ProjectConfiguration } from 'packages/engine/dist';

export const awsMinimalDatabaseState: ProjectConfiguration = {
  name: 'some-project',
  provider: 'aws',
  region: 'eu-central-1',
  state: {
    provider: 'aws',
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
