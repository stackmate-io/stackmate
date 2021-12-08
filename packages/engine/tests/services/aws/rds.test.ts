import { expect } from 'chai';

import { CloudPrerequisites, ServiceAttributes } from '../../../src/types';
import { CloudStack } from '../../../src/interfaces';
import { AwsMysqlService } from '../../../src/clouds/aws';
import { mysqlDatabaseConfiguration } from '../../fixtures';
import { getAwsPrerequisites, getMockStack } from '../../mocks';

describe('AwsMysqlService', () => {
  let stack: CloudStack;
  let prerequisites: CloudPrerequisites;
  let attributes: ServiceAttributes;

  beforeEach(() => {
    attributes = mysqlDatabaseConfiguration;
    stack = getMockStack();
    prerequisites = getAwsPrerequisites({ stack });
  });

  describe('populate', () => {
    let service: AwsMysqlService;

    beforeEach(() => {
      service = new AwsMysqlService(stack, prerequisites);
    });

    it('instantiates the service and assigns the attributes correctly', () => {
      service.populate(attributes);

      // const {
      //   name, region, /* size, storage, engine, database, */ credentials, rootCredentials,
      // } = attributes;

      expect(service.name).to.deep.equal(attributes.name);
      expect(service.region).to.deep.equal(attributes.region);
      expect(service.stage).to.deep.equal(stack.name);
      expect(service.credentials).to.be.an('Object');
      expect(service.rootCredentials).to.be.an('Object');
    });
  });
});
