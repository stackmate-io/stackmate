import {
  kmsKey,
  provider as terraformAwsProvider,
  internetGateway as awsInternetGateway,
  subnet as awsSubnet,
  vpc as awsVpc,
} from '@cdktf/provider-aws'

import { AwsProvider } from '@src/services/providers/aws/services/provider'
import { DEFAULT_REGION, REGIONS } from '@src/services/providers/aws/constants'
import { PROVIDER, SERVICE_TYPE } from '@src/constants'
import { Stack } from '@lib/stack'
import { getProvisionable } from '@core/provision'
import { type BaseProvisionable } from 'src/services/types/provisionable'
import type { AwsProviderResources, AwsProviderAttributes } from '@src/services/providers/aws/types'

describe('AWS Provider', () => {
  const service = AwsProvider

  it('is a valid AWS provider service', () => {
    expect(service.provider).toEqual(PROVIDER.AWS)
    expect(service.type).toEqual(SERVICE_TYPE.PROVIDER)
  })

  it('has the AWS regions set', () => {
    expect(new Set(service.regions)).toEqual(new Set(REGIONS))
  })

  it('contains a valid schema', () => {
    expect(service.schema).toMatchObject({
      $id: 'services/aws/provider',
      type: 'object',
      required: expect.arrayContaining(['name', 'provider', 'type']),
      additionalProperties: false,
      properties: {
        provider: {
          type: 'string',
          enum: [PROVIDER.AWS],
          default: PROVIDER.AWS,
        },
        type: {
          type: 'string',
          enum: [SERVICE_TYPE.PROVIDER],
        },
        region: {
          type: 'string',
          enum: Array.from(REGIONS),
          default: DEFAULT_REGION,
        },
        profile: { type: 'string', default: 'default', serviceProfile: true },
        overrides: { type: 'object', default: {}, serviceProfileOverrides: true },
      },
    })
  })

  describe('provision handler', () => {
    let stack: Stack
    let provisionable: BaseProvisionable
    let config: AwsProviderAttributes

    beforeEach(() => {
      stack = new Stack('stack-name')
      config = {
        provider: 'aws',
        name: 'aws-provider',
        type: SERVICE_TYPE.PROVIDER,
        region: 'eu-central-1',
      }

      provisionable = getProvisionable(config)
    })

    it('registers the service into the stack and creates the resources', () => {
      const resources = service.handler(provisionable, stack) as AwsProviderResources

      expect(resources).toBeInstanceOf(Object)
      expect(new Set(Object.keys(resources))).toEqual(
        new Set(['gateway', 'account', 'kmsKey', 'vpc', 'provider', 'subnets', 'outputs']),
      )
      expect(resources.gateway).toBeInstanceOf(awsInternetGateway.InternetGateway)
      expect(resources.kmsKey).toBeInstanceOf(kmsKey.KmsKey)
      expect(resources.vpc).toBeInstanceOf(awsVpc.Vpc)
      expect(resources.provider).toBeInstanceOf(terraformAwsProvider.AwsProvider)
      expect(Array.isArray(resources.subnets)).toBe(true)
      expect(resources.subnets.every((s) => s instanceof awsSubnet.Subnet)).toBe(true)
    })
  })
})
