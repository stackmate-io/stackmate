import {
  kmsKey,
  provider as terraformAwsProvider,
  internetGateway as awsInternetGateway,
  subnet as awsSubnet,
  vpc as awsVpc,
} from '@cdktf/provider-aws'

import { AwsProvider } from '@aws/services/provider'
import { REGIONS } from '@aws/constants'
import { DEFAULT_PROFILE_NAME, PROVIDER, SERVICE_TYPE } from '@src/constants'
import { Stack } from '@lib/stack'
import { Registry } from '@services/registry'
import type { BaseProvisionable } from '@src/services/types'
import type { AwsProviderResources } from '@aws/types'

describe('AWS Provider', () => {
  const service = AwsProvider

  it('is a valid AWS provider service', () => {
    expect(service.provider).toEqual(PROVIDER.AWS)
    expect(service.type).toEqual(SERVICE_TYPE.PROVIDER)
  })

  it('has the AWS regions set', () => {
    expect(service.regions).toEqual(expect.arrayContaining(REGIONS))
  })

  it('contains a valid schema', () => {
    expect(service.schema).toMatchObject({
      $id: 'services/aws/provider',
      required: expect.arrayContaining(['name', 'provider', 'type', 'region']),
      properties: {
        provider: expect.objectContaining({ const: PROVIDER.AWS }),
        type: expect.objectContaining({ const: SERVICE_TYPE.PROVIDER }),
        region: expect.objectContaining({
          type: 'string',
          enum: Array.from(REGIONS),
        }),
        profile: expect.objectContaining({
          type: 'string',
          default: DEFAULT_PROFILE_NAME,
          serviceProfile: true,
        }),
        overrides: expect.objectContaining({
          type: 'object',
          default: {},
          serviceProfileOverrides: true,
        }),
      },
    })
  })

  describe('provision handler', () => {
    let stack: Stack
    let provisionable: BaseProvisionable

    beforeEach(() => {
      stack = new Stack('stack-name')
      provisionable = Registry.provisionable({
        provider: PROVIDER.AWS,
        type: SERVICE_TYPE.PROVIDER,
        name: 'aws-provider',
        region: 'eu-central-1',
      })
    })

    it('registers the service into the stack and creates the resources', () => {
      const resources = service.handler(provisionable, stack) as AwsProviderResources

      expect(resources).toBeInstanceOf(Object)
      expect(Object.keys(resources)).toEqual(
        expect.arrayContaining([
          'gateway',
          'account',
          'kmsKey',
          'vpc',
          'provider',
          'subnets',
          'outputs',
        ]),
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
