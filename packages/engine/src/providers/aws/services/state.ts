import pipe from '@bitty/pipe';
import { S3Backend } from 'cdktf';
import { s3Bucket } from '@cdktf/provider-aws';

import { Stack } from '@stackmate/engine/core/stack';
import { SERVICE_TYPE } from '@stackmate/engine/constants';
import { DEFAULT_REGION, REGIONS } from '@stackmate/engine/providers/aws/constants';
import {
  AwsService, AwsServiceAttributes, getAwsCoreService,
} from '@stackmate/engine/providers/aws/service';
import {
  BaseServiceAttributes, Provisionable, withRegions, withHandler, withSchema,
} from '@stackmate/engine/core/service';

export type AwsStateDeployableResources = { backend: S3Backend };
export type AwsStatePreparableResources = { bucket: s3Bucket.S3Bucket };
export type AwsStateDestroyableResources = { backend: S3Backend };

export type AwsStateAttributes = AwsServiceAttributes<BaseServiceAttributes & {
  type: typeof SERVICE_TYPE.STATE;
  bucket: string;
}>;

export type AwsStateService = AwsService<AwsStateAttributes>;

export type AwsStateDeployableProvisionable = Provisionable<
  AwsStateService, AwsStateDeployableResources, 'deployable'
>;

export type AwsStateDestroyableProvisionable = Provisionable<
  AwsStateService, AwsStateDestroyableResources, 'destroyable'
>;

export type AwsStatePreparableProvisionable = Provisionable<
  AwsStateService, AwsStatePreparableResources, 'preparable'
>;

const registerBackend = (
  provisionable: AwsStateDeployableProvisionable | AwsStateDestroyableProvisionable,
  stack: Stack,
): AwsStateDestroyableResources | AwsStateDeployableResources => {
  const { config, requirements: { kmsKey } } = provisionable;

  const backend = new S3Backend(stack.context, {
    acl: 'private',
    bucket: config.bucket,
    encrypt: true,
    key: `${stack.projectName}/${stack.stageName}/terraform.tfstate`,
    kmsKeyId: kmsKey.id,
    region: config.region,
  });

  return { backend };
};

export const onDeploy = registerBackend;
export const onDestroy = registerBackend;
export const onPrepare = (
  provisionable: AwsStatePreparableProvisionable,
  stack: Stack,
): AwsStatePreparableResources => {
  const { config, requirements: { providerInstance }, resourceId } = provisionable;

  const bucket = new s3Bucket.S3Bucket(stack.context, resourceId, {
    acl: 'private',
    bucket: config.bucket,
    provider: providerInstance,
    versioning: {
      enabled: true,
      mfaDelete: true,
    },
  });

  return { bucket };
};

/**
 * @returns {AwsSecretsVaultService} the secrets vault service
 */
export const getStateService = (): AwsStateService => (
  pipe(
    withRegions(REGIONS, DEFAULT_REGION),
    withHandler('deployable', onDeploy),
    withHandler('destroyable', onDestroy),
    withHandler('preparable', onPrepare),
    withSchema<AwsStateAttributes, { bucket: string }>({
      type: 'object',
      required: ['bucket'],
      properties: {
        bucket: {
          type: 'string',
          /**
           * S3 Bucket naming rules
           * @link {https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucketnamingrules.html}
           * */
          minLength: 3,
          maxLength: 63,
          pattern: '(?!(^xn--|.+-s3alias$))^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$',
          isIncludedInConfigGeneration: true,
          serviceConfigGenerationTemplate: 'stackmate-state-${projectName}',
        },
      },
    }),
  )(getAwsCoreService(SERVICE_TYPE.STATE))
);

export const AwsState = getStateService();
