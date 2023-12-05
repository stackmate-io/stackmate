import { PROVIDER, SERVICE_TYPE } from '@src/constants'
import { getAwsProvisionable } from '@tests/helpers'
import { Stack } from '@src/lib/stack'
import { faker } from '@faker-js/faker'
import { Registry } from '@src/services/registry'
import { getValidData } from '@src/validation'
import { AwsSSL } from '@aws/services/ssl'
import { acmCertificate, route53Record } from '@cdktf/provider-aws'
import { TerraformOutput } from 'cdktf'
import { ProvisionablesMap } from '@src/operation'
import { resourceHandler as dnsResourceHandler } from '@aws/services/dns'
import type { AwsSSLAttributes, AwsSSLResources } from '@aws/services/ssl'
import type { AwsDnsProvisionable, AwsDnsResources } from '@aws/services/dns'

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
    expect(service.schema.$id).toEqual(`services/aws/${SERVICE_TYPE.SSL}`)
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
    let dnsPrerequisites: AwsDnsResources

    beforeEach(() => {
      const stack = new Stack(faker.lorem.word())

      config = {
        name: faker.lorem.word(),
        provider: PROVIDER.AWS,
        type: SERVICE_TYPE.SSL,
        domain: faker.internet.domainName(),
        validation: 'email',
        wildCard: false,
      }

      const dnsProvisionable = new ProvisionablesMap().create({
        provider: PROVIDER.AWS,
        name: 'aws-provider-service',
        type: SERVICE_TYPE.DNS,
        domain: config.domain,
      })

      dnsPrerequisites = dnsResourceHandler(dnsProvisionable as AwsDnsProvisionable, stack)
    })

    it('registers the resources on deployment - email validation', () => {
      const stack = new Stack('stack-name')
      const provisionable = getAwsProvisionable(config, stack, dnsPrerequisites)

      const resources = service.handler(provisionable, stack) as AwsSSLResources
      expect(resources.certificate instanceof acmCertificate.AcmCertificate).toBe(true)
      expect(resources.dnsRecord).toBeUndefined()
      expect(resources.outputs.every((o) => o instanceof TerraformOutput)).toBe(true)
    })

    it('registers the resources on deployment - DNS validation', () => {
      const stack = new Stack('stack-name')
      const cfg: AwsSSLAttributes = {
        ...config,
        validation: 'dns',
      }

      const provisionable = getAwsProvisionable(cfg, stack, dnsPrerequisites)

      const resources = service.handler(provisionable, stack) as AwsSSLResources
      expect(resources.certificate instanceof acmCertificate.AcmCertificate).toBe(true)
      expect(resources.dnsRecord instanceof route53Record.Route53Record).toBe(true)
      expect(resources.outputs.every((o) => o instanceof TerraformOutput)).toBe(true)
    })
  })
})
