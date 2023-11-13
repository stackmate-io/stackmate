import {
  dataAwsCallerIdentity,
  kmsKey,
  provider as terraformAwsProvider,
} from '@cdktf/provider-aws'
import { AwsProvider } from '@aws/services/provider'
import { REGIONS } from '@aws/constants'
import { PROVIDER, SERVICE_TYPE } from '@src/constants'
import { getProvisionable } from '@tests/mocks/getProvisionable'
import { Stack } from '@lib/stack'
import { faker } from '@faker-js/faker'
import { TerraformOutput } from 'cdktf'
import { Registry } from '@src/services/registry'
import type { BaseProvisionable } from '@src/services/types'
import type { AwsProviderResources } from '@aws/types'

describe('AWS Provider', () => {
  const service = AwsProvider

  it('is a valid AWS provider service', () => {
    expect(service.provider).toEqual(PROVIDER.AWS)
    expect(service.type).toEqual(SERVICE_TYPE.PROVIDER)
  })

  it('is fetched by the registry', () => {
    expect(Registry.get(PROVIDER.AWS, SERVICE_TYPE.PROVIDER))
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
      },
    })
  })

  describe('provision handler', () => {
    let stack: Stack
    let provisionable: BaseProvisionable

    beforeEach(() => {
      stack = new Stack(faker.lorem.word())
      provisionable = getProvisionable({
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
        expect.arrayContaining(['account', 'kmsKey', 'providerInstance', 'outputs']),
      )
      expect(resources.kmsKey).toBeInstanceOf(kmsKey.KmsKey)
      expect(resources.account).toBeInstanceOf(dataAwsCallerIdentity.DataAwsCallerIdentity)
      expect(resources.providerInstance).toBeInstanceOf(terraformAwsProvider.AwsProvider)
      expect(Array.isArray(resources.outputs)).toBe(true)
      expect(resources.outputs.every((o) => o instanceof TerraformOutput)).toBe(true)
    })
  })
})
