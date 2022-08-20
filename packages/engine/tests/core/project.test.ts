import { cloneDeep } from 'lodash';
import { deepEqual } from 'assert';
import Project from '@stackmate/engine/core/project';
import { awsMinimalDatabaseState } from 'tests/engine/fixtures/configs';

describe('Project', () => {
  describe('validate', () => {
    it('validates a correct configuration', () => {
      expect(() => Project.validate(awsMinimalDatabaseState, { useDefaults: false })).not.toThrow();
    });

    it('leaves the state of a valid configuration intact', () => {
      const source = cloneDeep(awsMinimalDatabaseState);
      Project.validate(awsMinimalDatabaseState, { useDefaults: false });
      expect(() => deepEqual(source, awsMinimalDatabaseState)).not.toThrow();
    });
  });
});
