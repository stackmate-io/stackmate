import 'cdktf/lib/testing/adapters/jest';

import Profile from '@stackmate/core/profile';
import { CloudPrerequisites } from '@stackmate/types';
import { CloudStack } from '@stackmate/interfaces';
import { PROVIDER, SERVICE_TYPE } from '@stackmate/constants';
import { getAwsPrerequisites, getMockStack } from 'tests/mocks';
import { networkingConfiguration as serviceConfig } from 'tests/fixtures';
import { AwsVpcService } from '@stackmate/clouds/aws';
import { getProvisionResults } from 'tests/helpers';

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
      const { name, region, ip } = serviceConfig;
      service = AwsVpcService.factory(serviceConfig, mockStack, prerequisites);

      expect(service.provider).toEqual(PROVIDER.AWS);
      expect(service.type).toEqual(SERVICE_TYPE.NETWORKING);
      expect(service.name).toEqual(name);
      expect(service.region).toEqual(region);
      expect(service.ip).toEqual(ip);
      expect(service.links).toEqual([]);
      expect(service.profile).toEqual(Profile.DEFAULT);
      expect(service.overrides).toEqual({});
    });

    it('returns the attribute names', () => {
      service = AwsVpcService.factory(serviceConfig, mockStack, prerequisites);
      expect(new Set(service.attributeNames)).toEqual(new Set([
        'name', 'region', 'links', 'profile', 'overrides', 'ip',
      ]));
    });
  });

  describe('provision', () => {
    it('provisions a VPC and its dependencies', async () => {
      const { scope, variables } = await getProvisionResults({
        provider: PROVIDER.AWS,
        serviceClass: AwsVpcService,
        serviceConfig,
        stackName: 'production',
      });

      console.log(scope, variables);
    });
  });
});
