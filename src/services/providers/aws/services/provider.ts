import pipe from 'lodash/fp/pipe'
import { kebabCase } from 'lodash'
import { TerraformOutput } from 'cdktf'
import {
  kmsKey as awsKmsKey,
  provider as awsProvider,
  dataAwsCallerIdentity as callerIdentity,
} from '@cdktf/provider-aws'
import { getBaseService } from '@services/utils'
import { REGIONS } from '@aws/constants'
import { DEFAULT_RESOURCE_COMMENT, PROVIDER, SERVICE_TYPE } from '@src/constants'
import { withHandler, withRegions } from '@services/behaviors'
import type { Stack } from '@lib/stack'
import type { AwsProviderService, AwsProviderProvisionable, AwsProviderResources } from '@aws/types'

export const resourceHandler = (
  provisionable: AwsProviderProvisionable,
  stack: Stack,
): AwsProviderResources => {
  const {
    config: { region },
    resourceId,
  } = provisionable

  const providerInstance = new awsProvider.AwsProvider(stack.context, PROVIDER.AWS, {
    region,
    alias: `aws-${kebabCase(region)}-provider`,
    defaultTags: [
      {
        tags: {
          Environment: stack.name,
          Description: DEFAULT_RESOURCE_COMMENT,
        },
      },
    ],
  })

  const kmsKey = new awsKmsKey.KmsKey(stack.context, `${resourceId}_key`, {
    customerMasterKeySpec: 'SYMMETRIC_DEFAULT',
    deletionWindowInDays: 30,
    description: 'Stackmate default encryption key',
    enableKeyRotation: false,
    isEnabled: true,
    keyUsage: 'ENCRYPT_DECRYPT',
    multiRegion: false,
    provider: providerInstance,
  })

  const account = new callerIdentity.DataAwsCallerIdentity(
    stack.context,
    `${resourceId}_account_id`,
    {
      provider: providerInstance,
    },
  )

  const outputs: TerraformOutput[] = [
    new TerraformOutput(stack.context, `${resourceId}_kms_key_id`, {
      description: 'KMS key ID',
      value: kmsKey.arn,
    }),
  ]

  return {
    providerInstance,
    kmsKey,
    account,
    outputs,
  }
}

const getProviderService = (): AwsProviderService =>
  pipe(
    withRegions(REGIONS),
    withHandler(resourceHandler),
  )(getBaseService(PROVIDER.AWS, SERVICE_TYPE.PROVIDER))

export const AwsProvider = getProviderService()
