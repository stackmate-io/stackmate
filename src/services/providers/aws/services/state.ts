import pipe from 'lodash/fp/pipe'
import { S3Backend } from 'cdktf'
import { SERVICE_TYPE } from '@src/constants'
import { REGIONS } from '@aws/constants'
import { getAwsService } from '@aws/utils/getAwsService'
import { withRegions, withHandler, withSchema, withAssociations } from '@services/behaviors'
import type { PROVIDER } from '@src/constants'
import type { RegionalAttributes } from '@services/behaviors'
import type { Stack } from '@lib/stack'
import type { JsonSchema } from '@lib/schema'
import type { Provisionable, BaseServiceAttributes, Service } from '@services/types'
import type { AwsProviderAssociations } from '@aws/types'
import { getProviderAssociations } from '../utils/getProviderAssociations'

type AdditionalAttrs = { bucket: string }

export type AwsStateAttributes = BaseServiceAttributes &
  RegionalAttributes &
  AdditionalAttrs & {
    type: typeof SERVICE_TYPE.STATE
    provider: typeof PROVIDER.AWS
  }

export type AwsStateService = Service<AwsStateAttributes, AwsProviderAssociations>
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
    dynamodbTable: 'stackmate-terraform-state-lock',
  })

  return { backend }
}

const getAdditionalPropertiesSchema = (): JsonSchema<AdditionalAttrs> => ({
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
    withRegions(REGIONS),
    withHandler(resourceHandler),
    withSchema<AwsStateAttributes, AdditionalAttrs>(getAdditionalPropertiesSchema()),
    withAssociations(getProviderAssociations()),
  )(getAwsService(SERVICE_TYPE.STATE))

export const AwsState = getStateService()
