import Project from '@stackmate/engine/core/project';
import { awsMinimalDatabaseState } from 'tests/engine/fixtures/configs';

describe('Project', () => {
  describe('validate', () => {
    it('validates a correct configuration', () => {
      expect(() => Project.validate(awsMinimalDatabaseState, { useDefaults: false })).not.toThrow();
    });
  });
});
