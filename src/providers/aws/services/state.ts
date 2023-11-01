import pipe from 'lodash/fp/pipe'
import { S3Backend } from 'cdktf'

import type { Stack } from '@core/stack'
import { SERVICE_TYPE } from '@constants'
import type { ServiceSchema } from '@core/schema'
import { DEFAULT_REGION, REGIONS } from '@providers/aws/constants'
import type { AwsService, AwsServiceAttributes } from '@providers/aws/service'
import { getAwsCoreService } from '@providers/aws/service'
import type { BaseServiceAttributes, Provisionable } from '@core/service'
import { withRegions, withHandler, withSchema } from '@core/service'

type AdditionalAttrs = { bucket: string }

export type AwsStateAttributes = AwsServiceAttributes<
  BaseServiceAttributes &
    AdditionalAttrs & {
      type: typeof SERVICE_TYPE.STATE
    }
>

export type AwsStateService = AwsService<AwsStateAttributes>
export type AwsStateResources = { backend: S3Backend }
export type AwsStateProvisionable = Provisionable<AwsStateService, AwsStateResources>

const resourceHandler = (provisionable: AwsStateProvisionable, stack: Stack): AwsStateResources => {
  const {
    config,
    requirements: { kmsKey },
  } = provisionable

  const backend = new S3Backend(stack.context, {
    acl: 'private',
    bucket: config.bucket,
    encrypt: true,
    key: `${stack.name}/terraform.tfstate`,
    kmsKeyId: kmsKey.id,
    region: config.region,
  })

  return { backend }
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
    },
  },
})

/**
 * @returns {AwsSecretsVaultService} the secrets vault service
 */
export const getStateService = (): AwsStateService =>
  pipe(
    withRegions(REGIONS, DEFAULT_REGION),
    withHandler(resourceHandler),
    withSchema<AwsStateAttributes, AdditionalAttrs>(getAdditionalPropertiesSchema()),
  )(getAwsCoreService(SERVICE_TYPE.STATE))

export const AwsState = getStateService()
