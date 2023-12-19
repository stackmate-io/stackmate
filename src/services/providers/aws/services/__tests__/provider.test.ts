import {
  dataAwsCallerIdentity,
  kmsKey,
  provider as terraformAwsProvider,
} from '@cdktf/provider-aws'
import { AwsProvider } from '@aws/services/provider'
import { REGIONS } from '@aws/constants'
import { PROVIDER, SERVICE_TYPE } from '@src/constants'
import { faker } from '@faker-js/faker'
import { Registry } from '@src/services/registry'
import { kebabCase } from 'lodash'
import { getSynthesizedStack } from '@tests/helpers/getSynthesizedStack'
import type { AwsProviderAttributes } from '@aws/types'

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
      $id: 'services-aws-provider',
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
    let config: AwsProviderAttributes

    beforeEach(() => {
      config = {
        provider: PROVIDER.AWS,
        type: SERVICE_TYPE.PROVIDER,
        name: kebabCase(faker.lorem.words()),
        region: 'eu-central-1',
      }
    })

    it('registers the service into the stack and creates the resources', () => {
      const stack = getSynthesizedStack([config])

      expect(stack).toHaveProvider(terraformAwsProvider.AwsProvider)
      expect(stack).toHaveResource(kmsKey.KmsKey)
      expect(stack).toHaveDataSource(dataAwsCallerIdentity.DataAwsCallerIdentity)
    })
  })
})
