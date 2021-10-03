import { ProjectConfiguration } from '@stackmate/types';

export const fullConfig: ProjectConfiguration = {
  name: 'full-config',
  provider: 'aws',
  region: 'eu-central-1',
  stages: {
    production: {
      database: {
        type: 'mysql',
        size: 'db.t2.large',
        storage: 30,
        database: 'my_database_name',
      },
    },
  },
  defaults: {
    aws: {
      'vpc-cidr': '12.0.0.1',
      'vpc-prefix': 'my-vpc-prefix',
    },
  },
};
