import { validate } from '@stackmate/engine/core/validation';
import { ProjectConfiguration } from '@stackmate/engine/types';

const config: ProjectConfiguration = {
  name: 'some project',
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

test('project validation', () => {
  validate(config);
});
