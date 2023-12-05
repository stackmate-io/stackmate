import { PROVIDER, SERVICE_TYPE } from '@src/constants'
import { getAwsProvisionable } from '@tests/helpers'
import { Stack } from '@src/lib/stack'
import { faker } from '@faker-js/faker'
import { route53Zone } from '@cdktf/provider-aws'
import { Registry } from '@src/services/registry'
import { AwsDnsService } from '@aws/services/dns'
import { getValidData } from '@src/validation'
import type { AwsDnsAttributes, AwsDnsResources } from '@aws/services/dns'

describe('AWS DNS', () => {
  const service = AwsDnsService

  it('is a valid AWS DNS service', () => {
    expect(service.provider).toEqual(PROVIDER.AWS)
    expect(service.type).toEqual(SERVICE_TYPE.DNS)
  })

  it('is fetched by the registry', () => {
    expect(Registry.get(PROVIDER.AWS, SERVICE_TYPE.DNS))
  })

  it('provides a valid schema', () => {
    expect(service.schema.$id).toEqual(`services/aws/${SERVICE_TYPE.DNS}`)
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

  it('registers the resources on deployment', () => {
    const stack = new Stack('stack-name')
    const config: AwsDnsAttributes = {
      name: faker.lorem.word(),
      provider: PROVIDER.AWS,
      type: SERVICE_TYPE.DNS,
      domain: faker.internet.domainName(),
    }

    const provisionable = getAwsProvisionable(config, stack)

    const resources = service.handler(provisionable, stack) as AwsDnsResources
    expect(resources.zone instanceof route53Zone.Route53Zone).toBe(true)
  })
})
