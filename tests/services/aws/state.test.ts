import { TerraformBackend } from 'cdktf'
import { Stack } from '@lib/stack'
import { AwsState } from '@providers/aws/services/state'
import { DEFAULT_REGION, REGIONS } from '@providers/aws/constants'
import { PROVIDER, SERVICE_TYPE } from '@constants'
import { getAwsProvisionableMock } from '@mocks/aws'
import type { BaseProvisionable } from '@core/services/types/provisionable'
import type { AwsStateAttributes } from '@providers/aws/services/state'

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
      required: expect.arrayContaining(['provider', 'name', 'type', 'bucket']),
      additionalProperties: false,
      properties: {
        provider: {
          type: 'string',
          enum: [PROVIDER.AWS],
          default: 'aws',
        },
        type: {
          type: 'string',
          enum: [SERVICE_TYPE.STATE],
        },
        region: {
          type: 'string',
          enum: Array.from(REGIONS),
          default: DEFAULT_REGION,
        },
        bucket: {
          type: 'string',
          minLength: 3,
          maxLength: 63,
        },
      },
    })
  })

  describe('provision handlers', () => {
    let stack: Stack
    let provisionable: BaseProvisionable
    let config: AwsStateAttributes

    beforeEach(() => {
      stack = new Stack('stack-name')
      config = {
        name: 'aws-state-service',
        provider: PROVIDER.AWS,
        type: SERVICE_TYPE.STATE,
        region: DEFAULT_REGION,
        bucket: 'some-bucket-name',
      }

      provisionable = getAwsProvisionableMock(config, stack)
    })

    it('registers the backend', () => {
      const resources = service.handler(provisionable, stack)
      expect(Object.keys(resources)).toEqual(['backend'])

      const { backend } = resources
      expect(backend).toBeInstanceOf(TerraformBackend)
    })
  })
})
