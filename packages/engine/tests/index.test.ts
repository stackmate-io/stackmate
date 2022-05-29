import { Validation } from '@stackmate/engine/core/validation';

const config = {
  name: 'some project',
  provider: 'aws',
  region: 'eu-central-1',
  state: {
    provider: 'aws',
    bucket: 'abc-defg',
  },
  stages: {
    production: {
      database: {
        type: 'mysql',
        name: 'mydatabase',
        database: 'mysqldb',
      }
    }
  }
};

test('project validation', () => {
  Validation.run(config);
});
