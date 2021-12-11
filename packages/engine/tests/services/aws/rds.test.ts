import 'cdktf/lib/testing/adapters/jest';
import { Testing } from 'cdktf';

import { CloudPrerequisites, DatabaseServiceAttributes } from '@stackmate/types';
import { CloudStack } from '@stackmate/interfaces';
import { AwsRdsService } from '@stackmate/clouds/aws';
import { PROVIDER, SERVICE_TYPE } from '@stackmate/constants';
import { mysqlDatabaseConfiguration } from 'tests/fixtures';
import { getAwsPrerequisites, getMockStack } from 'tests/mocks';

describe('AwsRdsService', () => {
  let mockStack: CloudStack;
  let prerequisites: CloudPrerequisites;
  let singleNodeConfig: DatabaseServiceAttributes;
  // let multiNodeConfig: DatabaseServiceAttributes;

  beforeEach(() => {
    singleNodeConfig = { ...mysqlDatabaseConfiguration, nodes: 1 };
    // multiNodeConfig = { ...mysqlDatabaseConfiguration, nodes: 5 };
    mockStack = getMockStack();
    prerequisites = getAwsPrerequisites({ stack: mockStack });
  });

  describe('populate', () => {
    let service: AwsRdsService;

    beforeEach(() => {
      service = new AwsRdsService(mockStack, prerequisites);
    });

    it('instantiates the service and assigns the attributes correctly', () => {
      service.populate(singleNodeConfig);

      const {
        name, region, size, storage, engine, database, credentials, rootCredentials,
      } = singleNodeConfig;

      expect(service.provider).toEqual(PROVIDER.AWS);
      expect(service.type).toEqual(SERVICE_TYPE.DATABASE);
      expect(service.name).toEqual(name);
      expect(service.region).toEqual(region);
      expect(service.size).toEqual(size);
      expect(service.storage).toEqual(storage);
      expect(service.engine).toEqual(engine);
      expect(service.database).toEqual(database);
      expect(service.stage).toEqual(mockStack.name);
      // expect(service.credentials).toBe('Object');
      expect(service.credentials).toEqual(credentials);
      // expect(service.rootCredentials).toBe('Object');
      expect(service.rootCredentials).toEqual(rootCredentials);
    });
  });

  describe('provision', () => {
    it('provisions a single-node RDS instance', () => {
      const scope = Testing.synthScope((stack) => {
        new AwsRdsService(stack as CloudStack, prerequisites).populate(singleNodeConfig);
      });

      console.log(scope);
    });

    it.todo('provisions a multi-node cluster');
  });
});
