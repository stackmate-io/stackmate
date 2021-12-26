import 'cdktf/lib/testing/adapters/jest';
// import { Testing } from 'cdktf';

import { CloudPrerequisites } from '@stackmate/types';
import { CloudStack } from '@stackmate/interfaces';
import { PROVIDER, SERVICE_TYPE } from '@stackmate/constants';
import { getAwsPrerequisites, getMockStack } from 'tests/mocks';
// import { enhanceStack } from 'tests/helpers';
import { networkingConfiguration as serviceConfig } from 'tests/fixtures';
import { AwsVpcService } from '@stackmate/clouds/aws';
import Profile from '@stackmate/core/profile';

describe('AwsVpcService', () => {
  let mockStack: CloudStack;
  let prerequisites: CloudPrerequisites;

  beforeEach(() => {
    prerequisites = getAwsPrerequisites({ stack: mockStack });
  });

  describe('instantiation', () => {
    let service: AwsVpcService;

    beforeEach(() => {
      mockStack = getMockStack();
    });

    it('instantiates the service and assigns the attributes correctly', () => {
      const { name, region, cidr } = serviceConfig;
      service = AwsVpcService.factory(serviceConfig, mockStack, prerequisites);

      expect(service.provider).toEqual(PROVIDER.AWS);
      expect(service.type).toEqual(SERVICE_TYPE.NETWORKING);
      expect(service.name).toEqual(name);
      expect(service.region).toEqual(region);
      expect(service.cidr).toEqual(cidr);
      expect(service.links).toEqual([]);
      expect(service.profile).toEqual(Profile.DEFAULT);
      expect(service.overrides).toEqual({});
    });

    it('returns the attribute names', () => {
      service = AwsVpcService.factory(serviceConfig, mockStack, prerequisites);
      expect(new Set(service.attributeNames)).toEqual(new Set([
        'name', 'region', 'links', 'profile', 'overrides', 'cidr',
      ]));
    });
  });
});
