import { S3Bucket } from '@cdktf/provider-aws/lib/s3';

import { TerraformBackend } from 'cdktf';
import { getStack, Stack } from '@stackmate/engine/core/stack';
import { AwsState } from '@stackmate/engine/providers';
import { Provisionable } from '@stackmate/engine/core/service';
import { DEFAULT_REGION, REGIONS } from '@stackmate/engine/providers/aws/constants';
import { PROVIDER, SERVICE_TYPE } from '@stackmate/engine';
import { getProvisionableFromConfig } from '@stackmate/engine/core/operation';
import { AwsProviderDeployableProvisionable, onDeployment } from '@stackmate/engine/providers/aws/services/provider';
import {
  AwsStateAttributes, AwsStateDeployableProvisionable, AwsStateDestroyableProvisionable,
  AwsStatePreparableProvisionable, onDeploy, onDestroy, onPrepare,
} from '@stackmate/engine/providers/aws/services/state';

describe('AWS state', () => {
  const service = AwsState;

  it('is a valid AWS secrets service', () => {
    expect(service.provider).toEqual(PROVIDER.AWS);
    expect(service.type).toEqual(SERVICE_TYPE.STATE);
  });

  it('has the AWS regions set', () => {
    expect(new Set(service.regions)).toEqual(new Set(REGIONS));
  });

  it('has the handlers registered', () => {
    expect(service.handlers.get('deployable')).toEqual(onDeploy);
    expect(service.handlers.get('preparable')).toEqual(onPrepare);
    expect(service.handlers.get('destroyable')).toEqual(onDestroy);
  });

  it('contains a valid schema', () => {
    expect(service.schema).toMatchObject({
      $id: 'services/aws/state',
      type: 'object',
      required: ['region', 'bucket'],
      additionalProperties: false,
      properties: {
        provider: {
          type: 'string',
          enum: [PROVIDER.AWS],
          default: 'aws',
        },
        type: {
          type: 'string',
          enum: [SERVICE_TYPE.STATE],
          default: SERVICE_TYPE.STATE,
        },
        region: {
          type: 'string',
          enum: Array.from(REGIONS),
          default: DEFAULT_REGION,
        },
        bucket: {
          type: 'string',
          minLength: 3,
          maxLength: 63,
          isIncludedInConfigGeneration: true,
          serviceConfigGenerationTemplate: 'stackmate-state-${type}-${projectName}',
        },
      },
    });
  });

  describe('provision handlers', () => {
    let stack: Stack;
    const stage = 'a-stage';
    let provisionable: Provisionable;
    let config: AwsStateAttributes;

    beforeEach(() => {
      stack = getStack('my-project', stage);
      config = {
        provider: 'aws',
        name: 'aws-state-service',
        type: SERVICE_TYPE.STATE,
        region: 'eu-central-1',
        bucket: 'some-bucket-name',
      };

      provisionable = getProvisionableFromConfig(config, stage);

      const awsProviderProvisionable = getProvisionableFromConfig({
        provider: PROVIDER.AWS,
        name: 'aws-provider-service',
        type: SERVICE_TYPE.PROVIDER,
        region: REGIONS[0],
      }, stage);

      // Assign the AWS provider requirements
      const awsProviderResources = onDeployment(
        awsProviderProvisionable as AwsProviderDeployableProvisionable, stack,
      );

      Object.assign(provisionable, {
        requirements: {
          kmsKey: awsProviderResources.kmsKey,
          providerInstance: awsProviderResources.provider,
        },
      });
    });

    it('registers the backend for the deployable scope', () => {
      const resources = onDeploy(provisionable as AwsStateDeployableProvisionable, stack);
      expect(Object.keys(resources)).toEqual(['backend']);

      const { backend } = resources;
      expect(backend).toBeInstanceOf(TerraformBackend);
    });

    it('registers the backend for the destroyable scope', () => {
      const resources = onDestroy(provisionable as AwsStateDestroyableProvisionable, stack);
      expect(Object.keys(resources)).toEqual(['backend']);

      const { backend } = resources;
      expect(backend).toBeInstanceOf(TerraformBackend);
    });

    it('registers the S3 bucket for the preparable scope', () => {
      const resources = onPrepare(provisionable as AwsStatePreparableProvisionable, stack);
      expect(Object.keys(resources)).toEqual(['bucket']);

      const { bucket } = resources;
      expect(bucket).toBeInstanceOf(S3Bucket);
    });
  });
});
