import pipe from '@bitty/pipe';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { kmsKey, provider as terraformAwsProvider, vpc } from '@cdktf/provider-aws';

import { ChoiceOf, getCidrBlocks, getIpAddressParts, hashString, OneOfType } from '@stackmate/engine/lib';
import { PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';
import { DEFAULT_REGION, REGIONS } from '@stackmate/engine/providers/aws/constants';
import {
  associate, BaseService, BaseServiceAttributes, getCloudService, getCoreService, Provisions,
  ServiceAssociations, BaseProvisionable, ServiceRequirement, ServiceTypeChoice, withRegions,
  Provisionable, Service, LinkableAttributes, ConnectableAttributes, ExternallyLinkableAttributes,
} from '@stackmate/engine/core/service';
import {
  AwsProviderAttributes,
  AwsProviderDeployableProvisionable,
  AwsProviderDestroyableProvisionable,
  AwsProviderPreparableProvisionable,
} from '@stackmate/engine/providers/aws/services/provider';
import { Stack } from '@stackmate/engine/core/stack';

type ProviderRequirement = ServiceRequirement<
  terraformAwsProvider.AwsProvider, typeof SERVICE_TYPE.PROVIDER
>;

type KmsKeyRequirement = ServiceRequirement<
  kmsKey.KmsKey, typeof SERVICE_TYPE.PROVIDER
>;

type VpcRequirement = ServiceRequirement<
  vpc.Vpc, typeof SERVICE_TYPE.PROVIDER
>;

export type AwsServiceAssociations = {
  deployable: {
    providerInstance: ProviderRequirement;
    kmsKey: KmsKeyRequirement;
    vpc: VpcRequirement;
  },
  preparable: {
    providerInstance: ProviderRequirement;
    kmsKey: KmsKeyRequirement;
  },
  destroyable: {
    providerInstance: ProviderRequirement;
    kmsKey: KmsKeyRequirement;
  },
};

export type AwsServiceAttributes<Attrs extends BaseServiceAttributes> = Attrs & {
  provider: typeof PROVIDER.AWS;
  region: ChoiceOf<typeof REGIONS>;
};

export type AwsService<
  Attrs extends BaseServiceAttributes,
  Assocs extends ServiceAssociations = {},
> = Service<AwsServiceAttributes<Attrs>, AwsServiceAssociations & Assocs>;

type ProviderProvisionable = OneOfType<[
  AwsProviderDeployableProvisionable,
  AwsProviderDestroyableProvisionable,
  AwsProviderPreparableProvisionable,
]>;

type LinkableServiceProvisionable = Provisionable<
  AwsService<BaseServiceAttributes & LinkableAttributes & ConnectableAttributes>,
  Provisions,
  'deployable'
>;

type ExternallyLinkableServiceProvisionable = Provisionable<
  AwsService<BaseServiceAttributes & ExternallyLinkableAttributes & ConnectableAttributes>,
  Provisions,
  'deployable'
>;

const getProviderInstanceRequirement = (): ProviderRequirement => ({
  from: SERVICE_TYPE.PROVIDER,
  requirement: true,
  where: (config: AwsProviderAttributes, linked: BaseServiceAttributes) => (
    config.provider === linked.provider && config.region === linked.region
  ),
  handler: (p: ProviderProvisionable): terraformAwsProvider.AwsProvider => (
    p.provisions.provider
  ),
});

const getKmsKeyRequirement = (): KmsKeyRequirement => ({
  from: SERVICE_TYPE.PROVIDER,
  requirement: true,
  where: (config: BaseServiceAttributes, linked: BaseServiceAttributes) => (
    config.provider === linked.provider && config.region === linked.region
  ),
  handler: (
    prov: AwsProviderDeployableProvisionable | AwsProviderPreparableProvisionable,
  ): kmsKey.KmsKey => (
    prov.provisions.kmsKey
  ),
});

const getVpcRequirement = (): VpcRequirement => ({
  from: SERVICE_TYPE.PROVIDER,
  requirement: true,
  where: (config: BaseServiceAttributes, linked: BaseServiceAttributes) => (
    config.provider === linked.provider && config.region === linked.region
  ),
  handler: (prov: AwsProviderDeployableProvisionable): vpc.Vpc => (
    prov.provisions.vpc
  ),
});

export const onServiceLinked = (
  provisionable: LinkableServiceProvisionable, linked: BaseProvisionable, stack: Stack,
) => {
  const { config: { port, name: toName }, requirements: { vpc } } = provisionable;
  const { provisions = {}, config: { name: fromName } } = linked;
  const sgName = `allow-incoming-from-${fromName}-to-${toName}`;
  const { ip } = provisions;

  if (!ip) {
    throw new Error(`The IP resource on service ${fromName} is not provisioned yet`);
  }

  return new SecurityGroup(stack.context, sgName, {
    vpcId: vpc.id,
    name: sgName,
    ingress: [{
      fromPort: port,
      toPort: port,
      description: `Allow connections from ${fromName} to ${toName}`,
      cidrBlocks: [ip.expression()],
    }],
  });
};

export const onExternalLink = (
  provisionable: ExternallyLinkableServiceProvisionable,
  linked: BaseProvisionable,
  stack: Stack,
) => {
  const { config: { externalLinks = [], port }, requirements: { vpc } } = provisionable;

  const securityGroups = externalLinks.map((ipAddress, idx) => {
    const { ip, mask } = getIpAddressParts(ipAddress);
    const sgName: string = `allow-external-ip-${hashString(ipAddress)}`;

    return new SecurityGroup(stack.context, sgName, {
      vpcId: vpc.id,
      name: sgName,
      ingress: [{
        fromPort: port,
        toPort: port,
        description: `Allow connections from ${ipAddress}`,
        cidrBlocks: getCidrBlocks(ip, mask),
      }],
    });
  });

  return securityGroups;
};

/**
 * @var {AwsServiceAssociations} associations every AWS service's associations
 */
const associations: AwsServiceAssociations = {
  deployable: {
    providerInstance: getProviderInstanceRequirement(),
    kmsKey: getKmsKeyRequirement(),
    vpc: getVpcRequirement(),
  },
  destroyable: {
    providerInstance: getProviderInstanceRequirement(),
    kmsKey: getKmsKeyRequirement(),
  },
  preparable: {
    providerInstance: getProviderInstanceRequirement(),
    kmsKey: getKmsKeyRequirement(),
  },
};

const getAwsService = (srv: BaseService) => (
  pipe(
    associate(associations),
    withRegions(REGIONS, DEFAULT_REGION),
  )(srv)
);

export const getAwsCoreService = (type: ServiceTypeChoice) => (
  getAwsService(getCoreService(PROVIDER.AWS, type))
);

export const getAwsCloudService = (type: ServiceTypeChoice) => (
  getAwsService(getCloudService(PROVIDER.AWS, type))
);
