import { s3Bucket } from '@cdktf/provider-aws'
import { TerraformBackend } from 'cdktf'

import { Stack } from '@core/stack'
import type {
  AwsStateAttributes,
  AwsStateDeployableProvisionable,
  AwsStateDestroyableProvisionable,
  AwsStatePreparableProvisionable,
} from '@providers/aws/services/state'
import { AwsState, onDeploy, onDestroy, onPrepare } from '@providers/aws/services/state'
import type { BaseProvisionable } from '@core/service'
import { DEFAULT_REGION, REGIONS } from '@providers/aws/constants'
import { PROVIDER, SERVICE_TYPE } from '@constants'
import { getAwsDeploymentProvisionableMock } from '@mocks/aws'

describe('AWS state', () => {
  const service = AwsState

  it('is a valid AWS secrets service', () => {
    expect(service.provider).toEqual(PROVIDER.AWS)
    expect(service.type).toEqual(SERVICE_TYPE.STATE)
  })

  it('has the AWS regions set', () => {
    expect(new Set(service.regions)).toEqual(new Set(REGIONS))
  })

  it('has the handlers registered', () => {
    expect(service.handlers.get('deployable')).toEqual(onDeploy)
    expect(service.handlers.get('preparable')).toEqual(onPrepare)
    expect(service.handlers.get('destroyable')).toEqual(onDestroy)
  })

  it('contains a valid schema', () => {
    expect(service.schema).toMatchObject({
      $id: 'services/aws/state',
      type: 'object',
      required: ['bucket'],
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
          default: SERVICE_TYPE.STATE,
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
          isIncludedInConfigGeneration: true,
          serviceConfigGenerationTemplate: 'stackmate-state-${projectName}',
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

      provisionable = getAwsDeploymentProvisionableMock(config, stack)
    })

    it('registers the backend for the deployable scope', () => {
      const resources = onDeploy(provisionable as AwsStateDeployableProvisionable, stack)
      expect(Object.keys(resources)).toEqual(['backend'])

      const { backend } = resources
      expect(backend).toBeInstanceOf(TerraformBackend)
    })

    it('registers the backend for the destroyable scope', () => {
      const resources = onDestroy(provisionable as AwsStateDestroyableProvisionable, stack)
      expect(Object.keys(resources)).toEqual(['backend'])

      const { backend } = resources
      expect(backend).toBeInstanceOf(TerraformBackend)
    })

    it('registers the S3 bucket for the preparable scope', () => {
      const resources = onPrepare(provisionable as AwsStatePreparableProvisionable, stack)
      expect(Object.keys(resources)).toEqual(['bucket'])

      const { bucket } = resources
      expect(bucket).toBeInstanceOf(s3Bucket.S3Bucket)
    })
  })
})
