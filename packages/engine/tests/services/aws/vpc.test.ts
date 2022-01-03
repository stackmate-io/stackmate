import 'cdktf/lib/testing/adapters/jest';
import { InternetGateway, Subnet, Vpc } from '@cdktf/provider-aws/lib/vpc';

import Profile from '@stackmate/core/profile';
import { CloudPrerequisites } from '@stackmate/types';
import { CloudStack } from '@stackmate/interfaces';
import { PROVIDER, SERVICE_TYPE } from '@stackmate/constants';
import { getMockStack } from 'tests/mocks';
import { networkingConfiguration as serviceConfig, stackName } from 'tests/fixtures';
import { AwsVpcService } from '@stackmate/clouds/aws';
import { getServiceProvisionResults } from 'tests/helpers';

describe('AwsVpcService', () => {
  let mockStack: CloudStack;
  const prerequisites: CloudPrerequisites = {};

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
      // verify the fixture
      expect(serviceConfig.ip).toEqual('12.0.0.0');
      const expectedVpcId = `$\{aws_vpc.${serviceConfig.name}-${stackName}.id}`;

      const { scope } = await getServiceProvisionResults({
        provider: PROVIDER.AWS,
        serviceClass: AwsVpcService,
        serviceConfig,
        stackName,
        withPrerequisites: false,
      });

      expect(scope).toHaveResourceWithProperties(Vpc, {
        cidr_block: `12.0.0.0/16`,
        enable_dns_hostnames: true,
        enable_dns_support: true,
      });

      expect(scope).toHaveResourceWithProperties(Subnet, {
        vpc_id: expectedVpcId,
        cidr_block: `12.0.1.0/24`,
        map_public_ip_on_launch: true,
      });

      expect(scope).toHaveResourceWithProperties(Subnet, {
        vpc_id: expectedVpcId,
        cidr_block: `12.0.2.0/24`,
        map_public_ip_on_launch: true,
      });

      expect(scope).toHaveResourceWithProperties(InternetGateway, {
        vpc_id: expectedVpcId,
      });
    });
  });
});
