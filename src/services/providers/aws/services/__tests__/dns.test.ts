import { PROVIDER, SERVICE_TYPE } from '@src/constants'
import { faker } from '@faker-js/faker'
import { route53Zone } from '@cdktf/provider-aws'
import { Registry } from '@src/services/registry'
import { getValidData } from '@src/validation'
import { AwsDns, type AwsDnsAttributes } from '@aws/services/dns'
import { getSynthesizedStack } from '@tests/helpers/getSynthesizedStack'

describe('AWS DNS', () => {
  const service = AwsDns

  it('is a valid AWS DNS service', () => {
    expect(service.provider).toEqual(PROVIDER.AWS)
    expect(service.type).toEqual(SERVICE_TYPE.DNS)
  })

  it('is fetched by the registry', () => {
    expect(Registry.get(PROVIDER.AWS, SERVICE_TYPE.DNS))
  })

  it('provides a valid schema', () => {
    expect(service.schema.$id).toEqual(`services-aws-${SERVICE_TYPE.DNS}`)
    expect(service.schema.required).toEqual(
      expect.arrayContaining(['provider', 'name', 'type', 'domain']),
    )
  })

  it('raises a validation error for missing configuration', () => {
    const config: Partial<AwsDnsAttributes> = {
      name: faker.lorem.word(),
      provider: PROVIDER.AWS,
      type: SERVICE_TYPE.DNS,
    }

    expect(() => getValidData(config, service.schema)).toThrow()
  })

  it('raises an error for an invalid domain', () => {
    const config: Partial<AwsDnsAttributes> = {
      name: faker.lorem.word(),
      provider: PROVIDER.AWS,
      type: SERVICE_TYPE.DNS,
      domain: 'abcdefg',
    }

    expect(() => getValidData(config, service.schema)).toThrow()
  })

  it('registers the resources on deployment', () => {
    const config: AwsDnsAttributes = {
      name: faker.lorem.word(),
      provider: PROVIDER.AWS,
      type: SERVICE_TYPE.DNS,
      domain: 'app.stackmate.io',
    }

    const stack = getSynthesizedStack([config])
    expect(stack).toHaveResource(route53Zone.Route53Zone)
  })
})
