import { PROVIDER, SERVICE_TYPE } from '@src/constants'
import { getAwsProvisionable } from '@tests/helpers'
import { Stack } from '@src/lib/stack'

import { AwsObjectStore } from '@aws/services/objectStore'
import { faker } from '@faker-js/faker'
import { iamPolicy, iamUserPolicyAttachment, s3Bucket } from '@cdktf/provider-aws'
import { TerraformOutput } from 'cdktf'
import { Registry } from '@src/services/registry'
import { getValidData } from '@src/validation'
import type { AwsObjectStoreAttributes, AwsObjectStoreResources } from '@aws/services/objectStore'

describe('AWS Object store', () => {
  const service = AwsObjectStore

  it('is a valid AWS Object store service', () => {
    expect(service.provider).toEqual(PROVIDER.AWS)
    expect(service.type).toEqual(SERVICE_TYPE.OBJECT_STORAGE)
    expect(service.regions).toBeUndefined()
  })

  it('is fetched by the registry', () => {
    expect(Registry.get(PROVIDER.AWS, SERVICE_TYPE.OBJECT_STORAGE))
  })

  it('provides a valid schema', () => {
    expect(service.schema.$id).toEqual(`services/aws/${SERVICE_TYPE.OBJECT_STORAGE}`)
    expect(service.schema.required).toEqual(expect.arrayContaining(['provider', 'name', 'type']))
    expect(service.schema.properties?.buckets).toMatchObject({
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: expect.arrayContaining(['name']),
        properties: {
          name: expect.objectContaining({
            type: 'string',
            minLength: 3,
            maxLength: 63,
          }),
          versioning: expect.objectContaining({ type: 'boolean' }),
          encrypted: expect.objectContaining({ type: 'boolean' }),
          publicRead: expect.objectContaining({ type: 'boolean' }),
        },
      },
    })
  })

  it('raises a validation error for missing configuration', () => {
    const config: Partial<AwsObjectStoreAttributes> = {
      name: faker.lorem.word(),
      provider: PROVIDER.AWS,
      type: SERVICE_TYPE.OBJECT_STORAGE,
    }

    expect(() => getValidData(config, service.schema)).toThrow()
  })

  it('registers the resources on deployment', () => {
    const stack = new Stack('stack-name')
    const config: AwsObjectStoreAttributes = {
      name: faker.lorem.word(),
      provider: PROVIDER.AWS,
      type: SERVICE_TYPE.OBJECT_STORAGE,
      links: [],
      buckets: [
        {
          name: faker.lorem.word(),
          encrypted: faker.datatype.boolean(),
          publicRead: faker.datatype.boolean(),
          versioning: faker.datatype.boolean(),
        },
      ],
    }
    const provisionable = getAwsProvisionable(config, stack)

    const resources = service.handler(provisionable, stack) as AwsObjectStoreResources
    expect(typeof resources === 'object').toBe(true)
    expect(Array.isArray(resources.buckets)).toBe(true)
    expect(resources.buckets).toHaveLength(1)
    expect(resources.buckets.every((b) => b instanceof s3Bucket.S3Bucket)).toBe(true)
    expect(resources.policy).toBeInstanceOf(iamPolicy.IamPolicy)
    expect(resources.attachment).toBeInstanceOf(iamUserPolicyAttachment.IamUserPolicyAttachment)
    expect(Array.isArray(resources.outputs)).toBe(true)
    expect(resources.outputs.every((o) => o instanceof TerraformOutput)).toBe(true)
  })
})
