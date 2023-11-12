import { S3Backend } from 'cdktf'
import { Stack } from '@lib/stack'
import { AwsState } from '@src/services/providers/aws/services/state'
import { REGIONS } from '@src/services/providers/aws/constants'
import { PROVIDER, SERVICE_TYPE } from '@src/constants'
import { getAwsProvisionable } from '@tests/mocks'
import type { AwsStateProvisionable } from '@src/services/providers/aws/services/state'
import type { BaseProvisionable } from 'src/services/types/provisionable'

describe('AWS state', () => {
  const service = AwsState

  it('is a valid AWS secrets service', () => {
    expect(service.provider).toEqual(PROVIDER.AWS)
    expect(service.type).toEqual(SERVICE_TYPE.STATE)
  })

  it('has the AWS regions set', () => {
    expect(new Set(service.regions)).toEqual(new Set(REGIONS))
  })

  it('contains a valid schema', () => {
    expect(service.schema).toMatchObject({
      $id: 'services/aws/state',
      type: 'object',
      required: expect.arrayContaining(['provider', 'name', 'type', 'region', 'bucket']),
      additionalProperties: false,
      properties: {
        provider: expect.objectContaining({ const: PROVIDER.AWS }),
        type: expect.objectContaining({ const: SERVICE_TYPE.STATE }),
        region: expect.objectContaining({
          type: 'string',
          enum: Array.from(REGIONS),
        }),
        bucket: expect.objectContaining({
          type: 'string',
          minLength: 3,
          maxLength: 63,
        }),
      },
    })
  })

  describe('provision handlers', () => {
    let stack: Stack
    let provisionable: BaseProvisionable

    beforeEach(() => {
      stack = new Stack('mystack')
      provisionable = getAwsProvisionable<AwsStateProvisionable>(
        {
          name: 'aws-state-service',
          provider: PROVIDER.AWS,
          type: SERVICE_TYPE.STATE,
          region: 'eu-central-1',
          bucket: 'some-bucket-name',
        },
        stack,
      )
    })

    it('registers the backend', () => {
      const resources = service.handler(provisionable, stack)
      expect(Object.keys(resources)).toEqual(['backend'])

      const { backend } = resources
      expect(backend).toBeInstanceOf(S3Backend)
    })
  })
})
