import pipe from 'lodash/fp/pipe'
import { isEmpty } from 'lodash'
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group'
import type {
  vpc,
  kmsKey,
  provider as terraformAwsProvider,
  dataAwsCallerIdentity,
} from '@cdktf/provider-aws'

import type { Stack } from '@core/stack'
import { PROVIDER, SERVICE_TYPE } from '@constants'
import { DEFAULT_REGION, REGIONS } from '@providers/aws/constants'
import { getCidrBlocks, getIpAddressParts } from '@lib/networking'
import { hashString } from '@lib/hash'
import type { ChoiceOf, Obj } from '@lib/util'
import type {
  BaseService,
  BaseServiceAttributes,
  Provisions,
  ServiceAssociations,
  BaseProvisionable,
  ServiceRequirement,
  ServiceTypeChoice,
  Provisionable,
  Service,
  LinkableAttributes,
  ConnectableAttributes,
  ExternallyLinkableAttributes,
} from '@core/service'
import { associate, getCloudService, getCoreService, withRegions } from '@core/service'
import type {
  AwsProviderAttributes,
  AwsProviderProvisionable,
} from '@providers/aws/services/provider'
import type {
  AwsAlarmPrerequisites,
  AwsServiceAlarmResources,
  MonitoredServiceProvisionable,
} from '@providers/aws/alarms'
import { getMonitoringPrerequisites } from '@providers/aws/alarms'

type ProviderRequirement = ServiceRequirement<
  terraformAwsProvider.AwsProvider,
  typeof SERVICE_TYPE.PROVIDER
>

type KmsKeyRequirement = ServiceRequirement<kmsKey.KmsKey, typeof SERVICE_TYPE.PROVIDER>

type VpcRequirement = ServiceRequirement<vpc.Vpc, typeof SERVICE_TYPE.PROVIDER>

type AccountRequirement = ServiceRequirement<
  dataAwsCallerIdentity.DataAwsCallerIdentity,
  typeof SERVICE_TYPE.PROVIDER
>

export type AwsServiceAssociations = {
  account: AccountRequirement
  providerInstance: ProviderRequirement
  kmsKey: KmsKeyRequirement
  vpc: VpcRequirement
}

export type AwsServiceAttributes<Attrs extends BaseServiceAttributes> = Attrs & {
  provider: typeof PROVIDER.AWS
  region: ChoiceOf<typeof REGIONS>
}

export type AwsService<
  Attrs extends BaseServiceAttributes,
  Assocs extends ServiceAssociations = Obj,
> = Service<AwsServiceAttributes<Attrs>, AwsServiceAssociations & Assocs>

type LinkableServiceProvisionable = Provisionable<
  AwsService<BaseServiceAttributes & LinkableAttributes & ConnectableAttributes>,
  Provisions
>

type ExternallyLinkableServiceProvisionable = Provisionable<
  AwsService<BaseServiceAttributes & ExternallyLinkableAttributes & ConnectableAttributes>,
  Provisions
>

/**
 * @returns {ProviderRequirement} the provider instance requirement for an aws service
 */
const getProviderInstanceRequirement = (): ProviderRequirement => ({
  with: SERVICE_TYPE.PROVIDER,
  requirement: true,
  where: (config: AwsProviderAttributes, linked: BaseServiceAttributes) =>
    config.provider === linked.provider && config.region === linked.region,
  handler: (p: AwsProviderProvisionable): terraformAwsProvider.AwsProvider => p.provisions.provider,
})

/**
 * @returns {AccountRequirement} the aws account associated with the service
 */
const getAccountRequirement = (): AccountRequirement => ({
  with: SERVICE_TYPE.PROVIDER,
  requirement: true,
  where: (config: BaseServiceAttributes, linked: BaseServiceAttributes) =>
    config.provider === linked.provider && config.region === linked.region,
  handler: (prov: AwsProviderProvisionable): dataAwsCallerIdentity.DataAwsCallerIdentity =>
    prov.provisions.account,
})

/**
 * @returns {KmsKeyRequirement} the KMS key requirement association
 */
const getKmsKeyRequirement = (): KmsKeyRequirement => ({
  with: SERVICE_TYPE.PROVIDER,
  requirement: true,
  where: (config: BaseServiceAttributes, linked: BaseServiceAttributes) =>
    config.provider === linked.provider && config.region === linked.region,
  handler: (prov: AwsProviderProvisionable): kmsKey.KmsKey => prov.provisions.kmsKey,
})

/**
 * @returns {VpcRequirement} the VPC requirement for the AWS service
 */
const getVpcRequirement = (): VpcRequirement => ({
  with: SERVICE_TYPE.PROVIDER,
  requirement: true,
  where: (config: BaseServiceAttributes, linked: BaseServiceAttributes) =>
    config.provider === linked.provider && config.region === linked.region,
  handler: (prov: AwsProviderProvisionable): vpc.Vpc => prov.provisions.vpc,
})

/**
 *
 * @param provisionable
 * @param stack
 * @param linked
 * @returns
 */
export const onServiceLinked = (
  provisionable: LinkableServiceProvisionable,
  stack: Stack,
  linked: BaseProvisionable,
) => {
  const {
    config: { port, name: toName },
    requirements: { vpc },
  } = provisionable
  const {
    provisions = {},
    config: { name: fromName },
  } = linked
  const sgName = `allow-incoming-from-${fromName}-to-${toName}`
  const { ip } = provisions

  if (!ip) {
    throw new Error(`The IP resource on service ${fromName} is not provisioned yet`)
  }

  return new SecurityGroup(stack.context, sgName, {
    vpcId: vpc.id,
    name: sgName,
    ingress: [
      {
        fromPort: port,
        toPort: port,
        description: `Allow connections from ${fromName} to ${toName}`,
        cidrBlocks: [ip.expression()],
      },
    ],
  })
}

export const onExternalLink = (
  provisionable: ExternallyLinkableServiceProvisionable,
  stack: Stack,
) => {
  const {
    config: { externalLinks = [], port },
    requirements: { vpc },
  } = provisionable

  const securityGroups = externalLinks.map((ipAddress) => {
    const { ip, mask } = getIpAddressParts(ipAddress)
    const sgName: string = `allow-external-ip-${hashString(ipAddress)}`

    return new SecurityGroup(stack.context, sgName, {
      vpcId: vpc.id,
      name: sgName,
      ingress: [
        {
          fromPort: port,
          toPort: port,
          description: `Allow connections from ${ipAddress}`,
          cidrBlocks: getCidrBlocks(ip, mask),
        },
      ],
    })
  })

  return securityGroups
}

/**
 * @var {AwsServiceAssociations} associations every AWS service's associations
 */
const associations: AwsServiceAssociations = {
  providerInstance: getProviderInstanceRequirement(),
  account: getAccountRequirement(),
  kmsKey: getKmsKeyRequirement(),
  vpc: getVpcRequirement(),
}

/**
 * @type {AwsServiceAlertsGenerator} describes an alert generator function
 */
export type AwsServiceAlertsGenerator = (
  provisionable: BaseProvisionable,
  stack: Stack,
  resources: BaseProvisionable['provisions'],
  prerequisites: AwsAlarmPrerequisites,
) => AwsServiceAlarmResources

/**
 * @param {MonitoredServiceProvisionable} provisionable the provisionable to set the alarms for
 * @param {Stack} stack the stack to deploy the resources on
 * @param {AwsServiceAlertsGenerator} alarmsGenerator the alarm generator function
 * @returns {ProvisionResources} the resources to be deployed in the stack
 */
export const withAwsAlarms =
  <T extends MonitoredServiceProvisionable>(
    provisionable: T,
    stack: Stack,
    alarmsGenerator: AwsServiceAlertsGenerator,
  ) =>
  (resources: T['provisions']): T['provisions'] | (T['provisions'] & AwsServiceAlarmResources) => {
    const {
      config: { monitoring },
    } = provisionable

    // Monitoring not configured, bail...
    if (isEmpty(monitoring) || (isEmpty(monitoring.emails) && isEmpty(monitoring.urls))) {
      return resources as T['provisions']
    }

    const prerequisites = getMonitoringPrerequisites(provisionable, stack)
    const alarms = alarmsGenerator(provisionable, stack, resources, prerequisites)

    return {
      ...resources,
      ...alarms,
    }
  }

const getAwsService = (srv: BaseService) =>
  pipe(associate(associations), withRegions(REGIONS, DEFAULT_REGION))(srv)

export const getAwsCoreService = (type: ServiceTypeChoice) =>
  getAwsService(getCoreService(PROVIDER.AWS, type))

export const getAwsCloudService = (type: ServiceTypeChoice) =>
  getAwsService(getCloudService(PROVIDER.AWS, type))
