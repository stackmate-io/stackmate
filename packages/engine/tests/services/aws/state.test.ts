import 'cdktf/lib/testing/adapters/jest';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3';
import { snakeCase } from 'lodash';

import Profile from '@stackmate/engine/core/profile';
import { projectName, stageName } from 'tests/fixtures/generic';
import { PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';
import { getServiceRegisterationResults } from 'tests/helpers';
import { stateConfiguration as serviceConfig } from 'tests/fixtures/aws';
import { State as AwsS3State } from '@stackmate/engine/providers/aws';

describe('AwsS3State', () => {
  describe('instantiation', () => {
    let service: AwsS3State;

    it('instantiates the service and assigns the attributes correctly', () => {
      const { name, region, bucket } = serviceConfig;

      service = AwsS3State.factory<AwsS3State>(serviceConfig, projectName, stageName);

      expect(service.provider).toEqual(PROVIDER.AWS);
      expect(service.type).toEqual(SERVICE_TYPE.STATE);
      expect(service.name).toEqual(name);
      expect(service.region).toEqual(region);
      expect(service.bucket).toEqual(bucket);
      expect(service.links).toEqual([]);
      expect(service.profile).toEqual(Profile.DEFAULT);
      expect(service.overrides).toEqual({});
      expect(service.identifier).toEqual(`${name}-${stageName}`.toLowerCase());
    });
  });

  describe('register to be prepared', () => {
    it('registers the state as a backend resource', async () => {
      const { AWS: provider } = PROVIDER;
      const providerAlias = `${provider}.${provider}_${snakeCase(serviceConfig.region)}`;
      const { scope } = await getServiceRegisterationResults({
        stageName,
        projectName,
        serviceConfig,
        serviceScope: 'preparable',
      });

      expect(scope).toHaveResourceWithProperties(S3Bucket,  {
        acl: 'private',
        bucket: serviceConfig.bucket,
        provider: providerAlias,
        versioning: {
          enabled: true,
          mfa_delete: true,
        },
      })
    });
  });
});
