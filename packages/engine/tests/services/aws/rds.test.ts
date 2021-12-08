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

  it('instantiates the service', () => {
    const service = new AwsMysqlService(stack, prerequisites).populate(attributes);
    expect(service.stage).to.deep.equal(stack.name);
  });
});
