import Project from '@stackmate/engine/core/project';
// import { awsMinimalDatabaseState } from 'tests/engine/fixtures/configs';

describe('Project', () => {
  describe('validate', () => {
    /*
    it('validates a correct configuration', () => {
      expect(() => Project.validate(awsMinimalDatabaseState, { useDefaults: false })).not.toThrow();
    });
    */

    it('leaves the state of the configuration intact', () => {
      const config = {
        name: 'some-project-name',
        provider: 'aws',
        region: 'eu-central-1',
        state: { bucket: 'stackmate-state-857f3777ff377a524b48fd091371488f' },
        stages: [
          {
            name: 'production',
            services: [
              {
                type: 'mysql',
                name: 'mysql1Aa4Efd0Ed95Dda310Bab17A6Dcc7Bf7'
              }
            ]
          },
          { name: 'staging', copy: 'production' }
        ]
      };

      const inspect = require('util').inspect;
      console.log('before', inspect(JSON.stringify(config), { depth: 30 }));

      Project.validate(config, { useDefaults: false });

      console.log('after', inspect(config, { depth: 30 }));
    });
  });
});
