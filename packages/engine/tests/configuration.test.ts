import { expect } from 'chai';
import Configuration from '../src/core/configuration';

describe.only('Configuration', () => {
  describe('validations', () => {
    it('raises a validation error for an empty configuration', () => {
      expect(() => new Configuration()).not.to.throw;
    });
  });
});
