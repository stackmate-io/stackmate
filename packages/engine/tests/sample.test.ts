import { expect } from 'chai';

import Service from '../src/core/service';
import { ServiceDeclaration } from '../src/types';

describe('test', () => {
  describe('me', () => {
    it('should return correct result', () => {
      expect(1 + 1).to.deep.equal(2);
    });
  });

  const attrs: ServiceDeclaration = {
    name: 'test1',
    provider: 'aws',
    type: 'mysql',
    region: 'eu-central-1',
  };

  describe('test1', () => {
    it('should log the service', () => {
      const srv = new Service(attrs);
      console.log(srv);
    });
  });
});
