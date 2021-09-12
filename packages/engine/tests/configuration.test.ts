import { expect } from 'chai';
import Configuration from '@stackmate/core/configuration';
// import Configuration from '../src/core/configuration';

describe.only('Configuration', () => {
  describe('validations', () => {
    it('raises a validation error for an empty configuration', () => {
      expect(() => new Configuration()).to.throw;
    });
  });
});
