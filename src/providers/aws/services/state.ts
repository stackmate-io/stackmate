import pipe from 'lodash/fp/pipe'
import { S3Backend } from 'cdktf'
import { s3Bucket } from '@cdktf/provider-aws'

import type { Stack } from '@core/stack'
import { SERVICE_TYPE } from '@constants'
import type { ServiceSchema } from '@core/schema'
import { DEFAULT_REGION, REGIONS } from '@providers/aws/constants'
import type { AwsService, AwsServiceAttributes } from '@providers/aws/service'
import { getAwsCoreService } from '@providers/aws/service'
import type { BaseServiceAttributes, Provisionable } from '@core/service'
import { withRegions, withHandler, withSchema } from '@core/service'

export type AwsStateDeployableResources = { backend: S3Backend }
export type AwsStatePreparableResources = { bucket: s3Bucket.S3Bucket }
export type AwsStateDestroyableResources = { backend: S3Backend }

type AdditionalAttrs = { bucket: string }

export type AwsStateAttributes = AwsServiceAttributes<
  BaseServiceAttributes &
    AdditionalAttrs & {
      type: typeof SERVICE_TYPE.STATE
    }
>

export type AwsStateService = AwsService<AwsStateAttributes>

export type AwsStateDeployableProvisionable = Provisionable<
  AwsStateService,
  AwsStateDeployableResources,
  'deployable'
>

export type AwsStateDestroyableProvisionable = Provisionable<
  AwsStateService,
  AwsStateDestroyableResources,
  'destroyable'
>

export type AwsStatePreparableProvisionable = Provisionable<
  AwsStateService,
  AwsStatePreparableResources,
  'preparable'
>

const registerBackend = (
  provisionable: AwsStateDeployableProvisionable | AwsStateDestroyableProvisionable,
  stack: Stack,
): AwsStateDestroyableResources | AwsStateDeployableResources => {
  const {
    config,
    requirements: { kmsKey },
  } = provisionable

  const backend = new S3Backend(stack.context, {
    acl: 'private',
    bucket: config.bucket,
    encrypt: true,
    key: `${stack.projectName}/${stack.stageName}/terraform.tfstate`,
    kmsKeyId: kmsKey.id,
    region: config.region,
  })

  return { backend }
}

export const onDeploy = registerBackend
export const onDestroy = registerBackend
export const onPrepare = (
  provisionable: AwsStatePreparableProvisionable,
  stack: Stack,
): AwsStatePreparableResources => {
  const {
    config,
    requirements: { providerInstance },
    resourceId,
  } = provisionable

  const bucket = new s3Bucket.S3Bucket(stack.context, resourceId, {
    acl: 'private',
    bucket: config.bucket,
    provider: providerInstance,
    versioning: {
      enabled: true,
      mfaDelete: true,
    },
  })

  return { bucket }
}

const getAdditionalPropertiesSchema = (): ServiceSchema<AdditionalAttrs> => ({
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
})

/**
 * @returns {AwsSecretsVaultService} the secrets vault service
 */
export const getStateService = (): AwsStateService =>
  pipe(
    withRegions(REGIONS, DEFAULT_REGION),
    withHandler('deployable', onDeploy),
    withHandler('destroyable', onDestroy),
    withHandler('preparable', onPrepare),
    withSchema<AwsStateAttributes, AdditionalAttrs>(getAdditionalPropertiesSchema()),
  )(getAwsCoreService(SERVICE_TYPE.STATE))

export const AwsState = getStateService()
