import { internetGateway, subnet, vpc } from '@cdktf/provider-aws'
import { REGIONS } from '@aws/constants'
import { DEFAULT_PROFILE_NAME, PROVIDER, SERVICE_TYPE } from '@src/constants'
import { AwsNetworking } from '@aws/services/networking'
import { Registry } from '@src/services/registry'
import { getSynthesizedStack } from '@tests/helpers/getSynthesizedStack'
import { getCidrBlocks } from '@src/lib/networking'
import type { AwsNetworkingAttributes } from '@aws/types'

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
      $id: 'services-aws-networking',
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
    let config: AwsNetworkingAttributes

    beforeEach(() => {
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
      const stack = getSynthesizedStack([config])
      expect(stack).toHaveResource(vpc.Vpc)
      expect(stack).toHaveResource(internetGateway.InternetGateway)
      expect(stack).toHaveResource(subnet.Subnet)
    })

    it('imports the default vpc when specified', () => {
      const configWithImportedVpc: AwsNetworkingAttributes = {
        ...config,
        vpcId: 'vpc-123456',
        rootIp: '19.1.1.1',
      }

      const stack = getSynthesizedStack([configWithImportedVpc])
      const [cidrBlock] = getCidrBlocks(configWithImportedVpc.rootIp, 16, 1, 16)

      expect(stack).toHaveResource(vpc.Vpc)
      expect(stack).toHaveResourceWithProperties(vpc.Vpc, {
        cidr_block: cidrBlock,
      })
    })
  })
})
