import { PROVIDER, SERVICE_TYPE } from '@src/constants'
import { faker } from '@faker-js/faker'
import { Registry } from '@src/services/registry'
import { getValidData } from '@src/validation'
import { AwsSSL } from '@aws/services/ssl'
import { acmCertificate, route53Record } from '@cdktf/provider-aws'
import { getSynthesizedStack } from '@tests/helpers/getSynthesizedStack'
import type { AwsSSLAttributes } from '@aws/services/ssl'

describe('AWS ACM SSL', () => {
  const service = AwsSSL

  it('is a valid AWS SSL service', () => {
    expect(service.provider).toEqual(PROVIDER.AWS)
    expect(service.type).toEqual(SERVICE_TYPE.SSL)
  })

  it('is fetched by the registry', () => {
    expect(Registry.get(PROVIDER.AWS, SERVICE_TYPE.SSL))
  })

  it('provides a valid schema', () => {
    expect(service.schema.$id).toEqual(`services-aws-${SERVICE_TYPE.SSL}`)
    expect(service.schema.required).toEqual(
      expect.arrayContaining(['provider', 'name', 'type', 'domain']),
    )
  })

  it('raises a validation error for missing configuration', () => {
    const config: Partial<AwsSSLAttributes> = {
      name: faker.lorem.word(),
      provider: PROVIDER.AWS,
      type: SERVICE_TYPE.SSL,
    }

    expect(() => getValidData(config, service.schema)).toThrow()
  })

  it('raises an error for an invalid domain', () => {
    const config: Partial<AwsSSLAttributes> = {
      name: faker.lorem.word(),
      provider: PROVIDER.AWS,
      type: SERVICE_TYPE.SSL,
      domain: 'abcdefg',
    }

    expect(() => getValidData(config, service.schema)).toThrow()
  })

  describe('resourceHandler', () => {
    let config: AwsSSLAttributes

    beforeEach(() => {
      config = {
        name: faker.lorem.word(),
        provider: PROVIDER.AWS,
        type: SERVICE_TYPE.SSL,
        domain: faker.internet.domainName(),
        validation: 'email',
        wildCard: false,
      }
    })

    it('registers the resources on deployment - email validation', () => {
      const stack = getSynthesizedStack([config])
      expect(stack).toHaveResourceWithProperties(acmCertificate.AcmCertificate, {
        domain_name: config.domain,
        validation_method: 'EMAIL',
      })

      expect(stack).not.toHaveResource(route53Record.Route53Record)
    })

    it('registers the resources on deployment - DNS validation', () => {
      const cfg: AwsSSLAttributes = {
        ...config,
        validation: 'dns',
      }

      const stack = getSynthesizedStack([cfg])

      expect(stack).toHaveResourceWithProperties(acmCertificate.AcmCertificate, {
        domain_name: config.domain,
        validation_method: 'DNS',
      })

      expect(stack).toHaveResource(route53Record.Route53Record)
    })
  })
})
