import {
  withHandler,
  type LinkableAttributes,
  withSchema,
  withAssociations,
} from '@src/services/behaviors'
import { PROVIDER, SERVICE_TYPE } from '@src/constants'
import { pipe } from 'lodash/fp'
import {
  dataAwsIamPolicyDocument,
  iamUser,
  iamPolicy,
  iamPolicyAttachment,
  s3Bucket,
} from '@cdktf/provider-aws'
import { camelCase, startCase } from 'lodash'
import { dataAwsIamPolicyDocumentStatementToTerraform } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document'
import { TerraformOutput } from 'cdktf'
import { getBucketNamingSchema } from '@aws/utils/getBucketNamingSchema'
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration'
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning'
import { S3BucketAcl } from '@cdktf/provider-aws/lib/s3-bucket-acl'
import { S3BucketOwnershipControls } from '@cdktf/provider-aws/lib/s3-bucket-ownership-controls'
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block'
import { getBaseService } from '@src/services/utils'
import { getProviderAssociations } from '@aws/utils/getProviderAssociations'
import type { ITerraformDependable } from 'cdktf'
import type { BaseServiceAttributes, Provisionable, Service } from '@services/types'
import type { Stack } from '@src/lib/stack'
import type { AwsProviderAssociations } from '@aws/types'

export type AwsObjectStoreAttributes = BaseServiceAttributes &
  LinkableAttributes & {
    provider: typeof PROVIDER.AWS
    type: typeof SERVICE_TYPE.OBJECT_STORAGE
    buckets: {
      name: string
      versioning: boolean
      encrypted: boolean
      publicRead: boolean
    }[]
  }
export type AwsObjectStoreService = Service<AwsObjectStoreAttributes, AwsProviderAssociations>

export type AwsObjectStoreResources = {
  user: iamUser.IamUser
  policy: iamPolicy.IamPolicy
  attachment: iamPolicyAttachment.IamPolicyAttachment
  buckets: s3Bucket.S3Bucket[]
  outputs: TerraformOutput[]
}
export type AwsObjectStoreProvisionable = Provisionable<
  AwsObjectStoreService,
  AwsObjectStoreResources
>

export const resourceHandler = (
  provisionable: AwsObjectStoreProvisionable,
  stack: Stack,
): AwsObjectStoreResources => {
  const {
    resourceId,
    config,
    requirements: { providerInstance, kmsKey },
  } = provisionable
  const prefix = startCase(camelCase(resourceId))
  const userName = `${prefix}StorageUser`

  const user = new iamUser.IamUser(stack.context, resourceId, {
    name: userName,
    provider: providerInstance,
  })

  const outputs: TerraformOutput[] = []
  const buckets: s3Bucket.S3Bucket[] = config.buckets.map((cfg) => {
    const bucketOptions: s3Bucket.S3BucketConfig = {
      bucket: cfg.name,
    }

    const bucket = new s3Bucket.S3Bucket(
      stack.context,
      `${resourceId}_bucket_${cfg.name}`,
      bucketOptions,
    )

    if (cfg.encrypted) {
      new S3BucketServerSideEncryptionConfigurationA(
        stack.context,
        `${resourceId}_${cfg.name}_encryption`,
        {
          bucket: bucket.id,
          rule: [
            {
              applyServerSideEncryptionByDefault: {
                kmsMasterKeyId: kmsKey.arn,
                sseAlgorithm: 'aws:kms',
              },
            },
          ],
        },
      )
    }

    const ownership = new S3BucketOwnershipControls(
      stack.context,
      `${resourceId}_${cfg.name}_ownership`,
      {
        bucket: bucket.id,
        rule: {
          objectOwnership: 'BucketOwnerPreferred',
        },
      },
    )

    const aclDependsOn: ITerraformDependable[] = [ownership]

    if (cfg.publicRead) {
      const block = new S3BucketPublicAccessBlock(
        stack.context,
        `${resourceId}_${cfg.name}_access_block`,
        {
          bucket: bucket.id,
          blockPublicAcls: false,
          blockPublicPolicy: false,
          ignorePublicAcls: false,
          restrictPublicBuckets: false,
        },
      )

      aclDependsOn.push(block)
    }

    new S3BucketAcl(stack.context, `${resourceId}_${cfg.name}_acl`, {
      bucket: bucket.id,
      acl: cfg.publicRead ? 'public-read' : 'private',
      dependsOn: aclDependsOn,
    })

    new S3BucketVersioningA(stack.context, `${resourceId}_${cfg.name}_versioning`, {
      bucket: bucket.id,
      versioningConfiguration: {
        status: cfg.versioning ? 'Enabled' : 'Disabled',
      },
    })

    outputs.push(
      new TerraformOutput(stack.context, `${resourceId}_bucket_${cfg.name}_domain_name`, {
        value: bucket.bucketDomainName,
      }),
      new TerraformOutput(stack.context, `${resourceId}_bucket_${cfg.name}_regional_domain_name`, {
        value: bucket.bucketRegionalDomainName,
      }),
    )

    return bucket
  })

  // See https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_examples_s3_rw-bucket.html
  const policyDocument = new dataAwsIamPolicyDocument.DataAwsIamPolicyDocument(
    stack.context,
    `${prefix}_policy_document`,
    {
      dependsOn: [user],
      provider: providerInstance,
      statement: [
        dataAwsIamPolicyDocumentStatementToTerraform({
          sid: 'ListObjectsInBucket',
          effect: 'Allow',
          principals: [{ type: 'AWS', identifiers: [user.arn] }],
          actions: ['s3:ListBucket'],
          resources: buckets.map((bk) => `arn:aws:s3:::${bk.bucket}`),
        }),
        dataAwsIamPolicyDocumentStatementToTerraform({
          sid: 'AllObjectActions',
          effect: 'Allow',
          principals: [{ type: 'AWS', identifiers: [user.arn] }],
          actions: ['s3:*Object'],
          resources: buckets.map((bk) => `arn:aws:s3:::${bk.bucket}/*`),
        }),
      ],
    },
  )

  const policy = new iamPolicy.IamPolicy(stack.context, `${resourceId}_policy`, {
    name: `${prefix}S3Policy`,
    policy: policyDocument.json,
    description: 'S3 User Policy',
  })

  const attachment = new iamPolicyAttachment.IamPolicyAttachment(
    stack.context,
    `${resourceId}_policy_attachment`,
    {
      name: `${prefix}PolicyAttachment`,
      policyArn: policy.arn,
      users: [user.arn],
    },
  )

  return {
    buckets,
    user,
    policy,
    outputs,
    attachment,
  }
}

const getObjectStoreService = (): AwsObjectStoreService =>
  pipe(
    withHandler(resourceHandler),
    withSchema({
      type: 'object',
      properties: {
        buckets: {
          type: 'array',
          minItems: 1,
          errorMessage: {
            minItems: 'You should provide at least one bucket',
          },
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['name'],
            properties: {
              name: getBucketNamingSchema(),
              versioning: {
                type: 'boolean',
                default: false,
              },
              encrypted: {
                type: 'boolean',
                default: false,
              },
              publicRead: {
                type: 'boolean',
                default: false,
              },
            },
          },
        },
      },
    }),
    withAssociations({
      ...getProviderAssociations(),
    }),
  )(getBaseService(PROVIDER.AWS, SERVICE_TYPE.OBJECT_STORAGE))

export const AwsObjectStore = getObjectStoreService()
