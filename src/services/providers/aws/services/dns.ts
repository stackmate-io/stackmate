import { route53Zone } from '@cdktf/provider-aws'
import { PROVIDER, SERVICE_TYPE } from '@src/constants'
import { pipe } from 'lodash/fp'
import { getBaseService } from '@src/services/utils'
import { withAssociations, withHandler, withSchema } from '@src/services/behaviors'
import { getProviderAssociations } from '@aws/utils/getProviderAssociations'
import type { Stack } from '@src/lib/stack'
import type { BaseServiceAttributes, Provisionable, Service } from '@src/services/types'
import type { AwsProviderAssociations } from '@aws/types'

export type AwsDnsAttributes = BaseServiceAttributes & {
  provider: typeof PROVIDER.AWS
  type: typeof SERVICE_TYPE.DNS
  domain: string
}

export type AwsDnsService = Service<AwsDnsAttributes, AwsProviderAssociations>

export type AwsDnsResources = {
  zone: route53Zone.Route53Zone
}

export type AwsDnsProvisionable = Provisionable<AwsDnsService, AwsDnsResources>

export const resourceHandler = (
  provisionable: AwsDnsProvisionable,
  stack: Stack,
): AwsDnsResources => {
  const {
    config,
    resourceId,
    requirements: { providerInstance },
  } = provisionable

  const zone = new route53Zone.Route53Zone(stack.context, resourceId, {
    name: config.domain,
    provider: providerInstance,
  })

  return {
    zone,
  }
}

const getDnsService = (): AwsDnsService =>
  pipe(
    withHandler(resourceHandler),
    withAssociations(getProviderAssociations()),
    withSchema({
      type: 'object',
      required: ['domain'],
      properties: {
        domain: {
          type: 'string',
          pattern:
            '^((?!-))(xn--)?[a-z0-9][a-z0-9-_]{0,61}[a-z0-9]{0,1}.(xn--)?([a-z0-9-]{1,61}|[a-z0-9-]{1,30}.[a-z]{2,})$',
        },
      },
    }),
  )(getBaseService(PROVIDER.AWS, SERVICE_TYPE.DNS))

export const AwsDnsService = getDnsService()
