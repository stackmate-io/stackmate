import type { JsonSchema } from '@src/lib/schema'

export const getBucketNamingSchema = (): JsonSchema => ({
  type: 'string',
  /**
   * S3 Bucket naming rules
   * @link {https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucketnamingrules.html}
   * */
  minLength: 3,
  maxLength: 63,
  pattern: '(?!(^xn--|.+-s3alias$))^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$',
})
