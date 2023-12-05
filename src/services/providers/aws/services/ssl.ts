import { acmCertificate, route53Record } from '@cdktf/provider-aws'
import { getDomainMatcher, getTopLevelDomain } from '@src/lib/domain'
import { TerraformIterator, TerraformOutput } from 'cdktf'
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

  if (config.validation === 'dns') {
    const optionsIterator = TerraformIterator.fromList(certificate.domainValidationOptions)

    dnsRecord = new route53Record.Route53Record(stack.context, `${resourceId}_verification`, {
      ttl: 60,
      allowOverwrite: true,
      forEach: optionsIterator,
      name: optionsIterator.value.name,
      records: [optionsIterator.value.record],
      type: optionsIterator.value.type,
      zoneId: dnsZone.id,
    })
  }

  const outputs = [
    new TerraformOutput(stack.context, `${resourceId}_verification_method`, {
      value: `${config.domain} will be verified via ${config.validation}`,
    }),
  ]

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
          pattern: String(getDomainMatcher()),
        },
        wildCard: {
          type: 'boolean',
          default: false,
        },
      },
    }),
  )(getBaseService(PROVIDER.AWS, SERVICE_TYPE.SSL))

export const AwsSSL = getSSLService()
