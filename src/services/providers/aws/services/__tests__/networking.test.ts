import { internetGateway, subnet, vpc } from '@cdktf/provider-aws'
import { REGIONS } from '@aws/constants'
import { DEFAULT_PROFILE_NAME, PROVIDER, SERVICE_TYPE } from '@src/constants'
import { getProvisionable } from '@tests/mocks/getProvisionable'
import { Stack } from '@lib/stack'
import { faker } from '@faker-js/faker'
import { TerraformOutput } from 'cdktf'
import { AwsNetworking } from '@aws/services/networking'
import { Registry } from '@src/services/registry'
import type { BaseProvisionable } from '@src/services/types'
import type { AwsNetworkingResources } from '@aws/types'

describe('AWS Networking', () => {
  const service = AwsNetworking

  it('is a valid AWS networking service', () => {
    expect(service.provider).toEqual(PROVIDER.AWS)
    expect(service.type).toEqual(SERVICE_TYPE.NETWORKING)
  })

  it('is fetched by the registry', () => {
    expect(Registry.get(PROVIDER.AWS, SERVICE_TYPE.NETWORKING))
  })

  it('has the AWS regions set', () => {
    expect(service.regions).toEqual(expect.arrayContaining(REGIONS))
  })

  it('contains a valid schema', () => {
    expect(service.schema).toMatchObject({
      $id: 'services/aws/networking',
      required: expect.arrayContaining(['name', 'provider', 'type', 'region']),
      properties: {
        provider: expect.objectContaining({ const: PROVIDER.AWS }),
        type: expect.objectContaining({ const: SERVICE_TYPE.NETWORKING }),
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
      stack = new Stack(faker.lorem.word())
      provisionable = getProvisionable({
        provider: PROVIDER.AWS,
        type: SERVICE_TYPE.NETWORKING,
        name: 'aws-networking',
        region: 'eu-central-1',
      })
    })

    it('registers the service into the stack and creates the resources', () => {
      const resources = service.handler(provisionable, stack) as AwsNetworkingResources

      expect(resources).toBeInstanceOf(Object)
      expect(Object.keys(resources)).toEqual(
        expect.arrayContaining(['vpc', 'subnets', 'gateway', 'outputs']),
      )
      expect(resources.vpc).toBeInstanceOf(vpc.Vpc)
      expect(resources.gateway).toBeInstanceOf(internetGateway.InternetGateway)
      expect(Array.isArray(resources.subnets)).toBe(true)
      expect(resources.subnets.every((s) => s instanceof subnet.Subnet)).toBe(true)
      expect(Array.isArray(resources.outputs)).toBe(true)
      expect(resources.outputs.every((o) => o instanceof TerraformOutput)).toBe(true)
    })
  })
})
