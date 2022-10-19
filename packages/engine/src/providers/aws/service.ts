import pipe from '@bitty/pipe';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { kmsKey, provider as terraformAwsProvider, vpc } from '@cdktf/provider-aws';

import { ChoiceOf, getCidrBlocks, getIpAddressParts, hashString, OneOfType } from '@stackmate/engine/lib';
import { PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';
import { DEFAULT_REGION, REGIONS } from '@stackmate/engine/providers/aws/constants';
import {
  associate, BaseService, BaseServiceAttributes, ExternalLinkHandler,
  getCloudService, getCoreService, Service, ServiceAssociations, ServiceLinkHandler, ServiceRequirement,
  ServiceScopeChoice, ServiceTypeChoice, withRegions,
} from '@stackmate/engine/core/service';
import {
  AwsProviderAttributes,
  AwsProviderDeployableProvisionable,
  AwsProviderDestroyableProvisionable,
  AwsProviderPreparableProvisionable,
} from '@stackmate/engine/providers/aws/services/provider';

type ProviderRequirement<Scope extends ServiceScopeChoice> = ServiceRequirement<
  'providerInstance', Scope, terraformAwsProvider.AwsProvider, typeof SERVICE_TYPE.PROVIDER
>;

type KmsKeyRequirement<Scope extends ServiceScopeChoice> = ServiceRequirement<
  'kmsKey', Scope, kmsKey.KmsKey, typeof SERVICE_TYPE.PROVIDER
>;

type VpcRequirement<Scope extends ServiceScopeChoice> = ServiceRequirement<
  'vpc', Scope, vpc.Vpc, typeof SERVICE_TYPE.PROVIDER
>;

export type AwsServiceAssociations = {
  deployable: {
    providerInstance: ProviderRequirement<'deployable'>;
    kmsKey: KmsKeyRequirement<'deployable'>;
    vpc: VpcRequirement<'deployable'>;
  },
  preparable: {
    providerInstance: ProviderRequirement<'preparable'>;
    kmsKey: KmsKeyRequirement<'preparable'>;
  },
  destroyable: {
    providerInstance: ProviderRequirement<'destroyable'>;
    kmsKey: KmsKeyRequirement<'destroyable'>;
  },
};

export type AwsServiceAttributes<Attrs extends BaseServiceAttributes> = Attrs & {
  provider: typeof PROVIDER.AWS;
  region: ChoiceOf<typeof REGIONS>;
};

export type AwsService<
  Attrs extends BaseServiceAttributes,
  Assocs extends ServiceAssociations = {},
> = Service<AwsServiceAttributes<Attrs>> & {
  associations: AwsServiceAssociations & Assocs,
};

type ProviderProvisionable = OneOfType<[
  AwsProviderDeployableProvisionable,
  AwsProviderDestroyableProvisionable,
  AwsProviderPreparableProvisionable,
]>;

const getProviderInstanceRequirement = <S extends ServiceScopeChoice>(
  scope: S,
): ProviderRequirement<S> => ({
  as: 'providerInstance',
  from: SERVICE_TYPE.PROVIDER,
  scope,
  requirement: true,
  where: (config: AwsProviderAttributes, linked: BaseServiceAttributes) => (
    config.provider === linked.provider && config.region === linked.region
  ),
  handler: (p: ProviderProvisionable): terraformAwsProvider.AwsProvider => (
    p.provisions.provider
  ),
});

const getKmsKeyRequirement = <S extends ServiceScopeChoice>(
  scope: S,
): KmsKeyRequirement<S> => ({
  as: 'kmsKey',
  from: SERVICE_TYPE.PROVIDER,
  scope,
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

const getVpcRequirement = <S extends ServiceScopeChoice>(
  scope: S,
): VpcRequirement<S> => ({
  as: 'vpc',
  from: SERVICE_TYPE.PROVIDER,
  scope,
  requirement: true,
  where: (config: BaseServiceAttributes, linked: BaseServiceAttributes) => (
    config.provider === linked.provider && config.region === linked.region
  ),
  handler: (prov: AwsProviderDeployableProvisionable): vpc.Vpc => (
    prov.provisions.vpc
  ),
});

export const onServiceLinked: ServiceLinkHandler = (provisionable, linked, stack) => {
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

export const onExternalLink: ExternalLinkHandler = (provisionable, linked, stack) => {
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
    providerInstance: getProviderInstanceRequirement('deployable'),
    kmsKey: getKmsKeyRequirement('deployable'),
    vpc: getVpcRequirement('deployable'),
  },
  destroyable: {
    providerInstance: getProviderInstanceRequirement('destroyable'),
    kmsKey: getKmsKeyRequirement('destroyable'),
  },
  preparable: {
    providerInstance: getProviderInstanceRequirement('preparable'),
    kmsKey: getKmsKeyRequirement('preparable'),
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
