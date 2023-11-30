import pipe from 'lodash/fp/pipe'
import { S3Backend } from 'cdktf'
import { SERVICE_TYPE, PROVIDER } from '@src/constants'
import { REGIONS } from '@aws/constants'
import { withRegions, withHandler, withSchema, withAssociations } from '@services/behaviors'
import { getProviderAssociations } from '@aws/utils/getProviderAssociations'
import { getBaseService } from '@src/services/utils'
import type { RegionalAttributes } from '@services/behaviors'
import type { Stack } from '@lib/stack'
import type { JsonSchema } from '@lib/schema'
import type { Provisionable, BaseServiceAttributes, Service } from '@services/types'
import type { AwsProviderAssociations } from '@aws/types'

type AdditionalAttrs = {
  bucket: string
  statePath: string
  lockTable: string
}

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
  const { config } = provisionable

  const backend = new S3Backend(stack.context, {
    acl: 'private',
    bucket: config.bucket,
    encrypt: true,
    region: config.region,
    key: config.statePath || `${stack.name}/stackmate.tfstate`,
    dynamodbTable: config.lockTable || 'stackmate-terraform-state-lock',
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
    statePath: {
      type: 'string',
      minLength: 2,
      maxLength: 255,
      default: 'stackmate.tfstate',
      pattern: '.*.tfstate$',
    },
    lockTable: {
      type: 'string',
      minLength: 2,
      maxLength: 255,
      default: 'stackmate-terraform-state-lock',
    },
  },
})

/**
 * @returns {AwsStateService} the secrets vault service
 */
export const getStateService = (): AwsStateService =>
  pipe(
    withRegions(REGIONS),
    withHandler(resourceHandler),
    withSchema<AwsStateAttributes, AdditionalAttrs>(getAdditionalPropertiesSchema()),
    withAssociations(getProviderAssociations()),
  )(getBaseService(PROVIDER.AWS, SERVICE_TYPE.STATE))

export const AwsState = getStateService()
