import { internetGateway, subnet, vpc } from '@cdktf/provider-aws'
import { REGIONS } from '@aws/constants'
import { DEFAULT_PROFILE_NAME, PROVIDER, SERVICE_TYPE } from '@src/constants'
import { Stack } from '@lib/stack'
import { faker } from '@faker-js/faker'
import { TerraformOutput } from 'cdktf'
import { AwsNetworking } from '@aws/services/networking'
import { Registry } from '@src/services/registry'
import { getProvisionable } from '@tests/helpers'
import type { AwsNetworkingAttributes, AwsNetworkingResources } from '@aws/types'

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
    let config: AwsNetworkingAttributes

    beforeEach(() => {
      stack = new Stack(faker.lorem.word())
      config = {
        provider: PROVIDER.AWS,
        type: SERVICE_TYPE.NETWORKING,
        name: 'aws-networking',
        region: 'eu-central-1',
        profile: 'default',
        overrides: {},
      }
    })

    it('registers the service into the stack and creates the resources', () => {
      const provisionable = getProvisionable(config)
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

    it('imports the default vpc when specified', () => {
      const configWithImportedVpc: AwsNetworkingAttributes = {
        ...config,
        vpcId: 'vpc-123456',
        rootIp: '19.1.1.1',
      }

      const provisionable = getProvisionable(configWithImportedVpc)
      const resources = service.handler(provisionable, stack) as AwsNetworkingResources
      expect(resources.vpc).toBeInstanceOf(vpc.Vpc)

      const {
        import: [importStatement],
      } = resources.vpc.toTerraform()

      expect(importStatement.id).toEqual(`${resources.vpc.friendlyUniqueId}_imported_default_vpc`)
      expect(importStatement.to).toEqual(
        `${vpc.Vpc.tfResourceType}.${resources.vpc.friendlyUniqueId}`,
      )
    })
  })
})
