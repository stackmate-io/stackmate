import { expect } from 'chai';

import { CloudPrerequisites, DatabaseServiceAttributes } from '../../../src/types';
import { CloudStack } from '../../../src/interfaces';
import { AwsMysqlService } from '../../../src/clouds/aws';
import { mysqlDatabaseConfiguration } from '../../fixtures';
import { getAwsPrerequisites, getMockStack } from '../../mocks';
import { PROVIDER, SERVICE_TYPE } from '../../../src/constants';

describe('AwsMysqlService', () => {
  let stack: CloudStack;
  let prerequisites: CloudPrerequisites;
  let singleNodeConfig: DatabaseServiceAttributes;
  // let multiNodeConfig: DatabaseServiceAttributes;

  beforeEach(() => {
    singleNodeConfig = { ...mysqlDatabaseConfiguration, nodes: 1 };
    // multiNodeConfig = { ...mysqlDatabaseConfiguration, nodes: 5 };
    stack = getMockStack();
    prerequisites = getAwsPrerequisites({ stack });
  });

  describe('populate', () => {
    let service: AwsMysqlService;

    beforeEach(() => {
      service = new AwsMysqlService(stack, prerequisites);
    });

    it('instantiates the service and assigns the attributes correctly', () => {
      service.populate(singleNodeConfig);

      const {
        name, region, size, storage, engine, database, credentials, rootCredentials,
      } = singleNodeConfig;

      expect(service.provider).to.deep.equal(PROVIDER.AWS);
      expect(service.type).to.deep.equal(SERVICE_TYPE.MYSQL);
      expect(service.name).to.deep.equal(name);
      expect(service.region).to.deep.equal(region);
      expect(service.size).to.deep.equal(size);
      expect(service.storage).to.deep.equal(storage);
      expect(service.engine).to.deep.equal(engine);
      expect(service.database).to.deep.equal(database);
      expect(service.stage).to.deep.equal(stack.name);
      expect(service.credentials).to.be.an('Object');
      expect(service.credentials).to.deep.equal(credentials);
      expect(service.rootCredentials).to.be.an('Object');
      expect(service.rootCredentials).to.deep.equal(rootCredentials);
    });
  });

  describe('provision', () => {
    it('provisions a single-node RDS instance');
    it('provisions a multi-node cluster');
  });
});
