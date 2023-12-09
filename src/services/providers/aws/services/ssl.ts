import { acmCertificate, acmCertificateValidation, route53Record } from '@cdktf/provider-aws'
import { getDomainMatcher, getTopLevelDomain } from '@src/lib/domain'
import { TerraformOutput } from 'cdktf'
import { PROVIDER, SERVICE_TYPE } from '@src/constants'
import { pipe } from 'lodash/fp'
import { getBaseService } from '@src/services/utils'
import { withAssociations, withHandler, withSchema } from '@src/services/behaviors'
import { getProviderAssociations } from '@aws/utils/getProviderAssociations'
import type { route53Zone } from '@cdktf/provider-aws'
import type { Stack } from '@lib/stack'
import type {
  BaseServiceAttributes,
  Provisionable,
  Service,
  ServiceRequirement,
} from '@src/services/types'
import type { AwsProviderAssociations } from '@aws/types'
import type { AwsDnsAttributes, AwsDnsProvisionable, AwsDnsResources } from './dns'

export type AwsSSLAttributes = BaseServiceAttributes & {
  provider: typeof PROVIDER.AWS
  type: typeof SERVICE_TYPE.SSL
  validation: 'email' | 'dns'
  domain: string
  wildCard: boolean
}

type AwsDnsAssociations = {
  zone: ServiceRequirement<AwsDnsResources['zone'], 'dns'>
}

export type AwsSSLService = Service<AwsSSLAttributes, AwsProviderAssociations & AwsDnsAssociations>

export type AwsSSLResources = {
  certificate: acmCertificate.AcmCertificate
  dnsRecord?: route53Record.Route53Record
  outputs: TerraformOutput[]
}

export type AwsSSLProvisionable = Provisionable<AwsSSLService, AwsSSLResources>

const dnsAssociations: AwsDnsAssociations = {
  zone: {
    with: SERVICE_TYPE.DNS,
    requirement: true,
    where: (source: AwsSSLAttributes, target: AwsDnsAttributes) =>
      getTopLevelDomain(source.domain) === getTopLevelDomain(target.domain),
    handler: (p: AwsDnsProvisionable): route53Zone.Route53Zone => p.provisions.zone,
  },
}

export const resourceHandler = (
  provisionable: AwsSSLProvisionable,
  stack: Stack,
): AwsSSLResources => {
  const {
    resourceId,
    config,
    requirements: { providerInstance, zone: dnsZone },
  } = provisionable

  let dnsRecord: route53Record.Route53Record | undefined
  const topLevelDomain = getTopLevelDomain(config.domain)

  const certificate = new acmCertificate.AcmCertificate(stack.context, resourceId, {
    domainName: config.domain,
    subjectAlternativeNames: config.wildCard ? [`*.${config.domain}`] : undefined,
    validationMethod: config.validation.toUpperCase(),
    provider: providerInstance,
    validationOption: [
      {
        domainName: config.domain,
        validationDomain: topLevelDomain,
      },
    ],
    lifecycle: {
      createBeforeDestroy: true,
    },
  })

  const certValidation = new acmCertificateValidation.AcmCertificateValidation(
    stack.context,
    `${resourceId}_certificate_validation`,
    {
      certificateArn: certificate.arn,
      provider: providerInstance,
      timeouts: { create: config.validation === 'dns' ? '1m' : '5m' },
    },
  )

  if (config.validation === 'dns') {
    // After several attempts with TerraformIterator.fromComplexList()
    // This is the only way to properly iterate the dynamic list
    // https://github.com/hashicorp/terraform-cdk/issues/430#issuecomment-831511019
    const record = new route53Record.Route53Record(
      stack.context,
      `${resourceId}_validation_record`,
      {
        name: '${each.value.name}',
        type: '${each.value.type}',
        records: ['${each.value.record}'],
        zoneId: dnsZone.zoneId,
        ttl: 60,
        allowOverwrite: true,
      },
    )

    record.addOverride(
      'for_each',
      `\${{
        for dvo in ${certificate.fqn}.domain_validation_options : dvo.domain_name => {
          name   = dvo.resource_record_name
          record = dvo.resource_record_value
          type   = dvo.resource_record_type
        }
      }
    }`,
    )

    certValidation.addOverride(
      'validation_record_fqdns',
      `\${[for record in ${record.fqn} : record.fqdn]}`,
    )
  }

  const outputs = [
    new TerraformOutput(stack.context, `${resourceId}_verification_method`, {
      value: `${config.domain} verification method is set to "${config.validation}"`,
    }),
  ]

  if (config.validation === 'dns') {
    outputs.push(
      new TerraformOutput(stack.context, `${resourceId}_verification_records`, {
        value: certificate.domainValidationOptions,
        description: 'The SSL validation DNS records',
      }),
    )
  }

  return {
    certificate,
    outputs,
    dnsRecord,
  }
}

const getSSLService = (): AwsSSLService =>
  pipe(
    withHandler(resourceHandler),
    withAssociations(getProviderAssociations()),
    withAssociations(dnsAssociations),
    withSchema({
      type: 'object',
      required: ['domain'],
      properties: {
        validation: {
          type: 'string',
          enum: ['email', 'dns'],
          default: 'email',
        },
        domain: {
          type: 'string',
          pattern: getDomainMatcher(),
        },
        wildCard: {
          type: 'boolean',
          default: false,
        },
      },
    }),
  )(getBaseService(PROVIDER.AWS, SERVICE_TYPE.SSL))

export const AwsSSL = getSSLService()
