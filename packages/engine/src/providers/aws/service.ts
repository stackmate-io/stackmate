import pipe from '@bitty/pipe';
import { isEmpty, snakeCase } from 'lodash';
import { TerraformResource } from 'cdktf';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import {
  vpc,
  kmsKey,
  provider as terraformAwsProvider,
  cloudwatchMetricAlarm,
  dataAwsCallerIdentity,
  snsTopic,
  snsTopicPolicy,
  dataAwsIamPolicyDocument,
  snsTopicSubscription,
} from '@cdktf/provider-aws';

import { Stack } from '@stackmate/engine/core/stack';
import { ChoiceOf, getCidrBlocks, getIpAddressParts, hashString, OneOfType } from '@stackmate/engine/lib';
import { PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';
import { DEFAULT_REGION, REGIONS } from '@stackmate/engine/providers/aws/constants';
import {
  associate, BaseService, BaseServiceAttributes, getCloudService, getCoreService, Provisions,
  ServiceAssociations, BaseProvisionable, ServiceRequirement, ServiceTypeChoice, withRegions,
  Provisionable, Service, LinkableAttributes, ConnectableAttributes,
  ExternallyLinkableAttributes, MonitoringAttributes,
} from '@stackmate/engine/core/service';
import {
  AwsProviderAttributes,
  AwsProviderDeployableProvisionable,
  AwsProviderDestroyableProvisionable,
  AwsProviderPreparableProvisionable,
} from '@stackmate/engine/providers/aws/services/provider';

type ProviderRequirement = ServiceRequirement<
  terraformAwsProvider.AwsProvider, typeof SERVICE_TYPE.PROVIDER
>;

type KmsKeyRequirement = ServiceRequirement<
  kmsKey.KmsKey, typeof SERVICE_TYPE.PROVIDER
>;

type VpcRequirement = ServiceRequirement<
  vpc.Vpc, typeof SERVICE_TYPE.PROVIDER
>;

type AccountRequirement = ServiceRequirement<
  dataAwsCallerIdentity.DataAwsCallerIdentity, typeof SERVICE_TYPE.PROVIDER
>;

export type AwsServiceAssociations = {
  deployable: {
    providerInstance: ProviderRequirement;
    account: AccountRequirement;
    kmsKey: KmsKeyRequirement;
    vpc: VpcRequirement;
  },
  preparable: {
    account: AccountRequirement,
    providerInstance: ProviderRequirement;
    kmsKey: KmsKeyRequirement;
  },
  destroyable: {
    account: AccountRequirement;
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

type MonitoredServiceProvisionable = Provisionable<
  AwsService<BaseServiceAttributes & MonitoringAttributes>,
  Provisions,
  'deployable'
>;

const AWS_SERVICE_INFO: Map<ServiceTypeChoice, { name: string; url: string }> = new Map([
  [SERVICE_TYPE.MYSQL, { name: 'Allow RDS Events', url: 'rds.amazonaws.com' }],
  [SERVICE_TYPE.MARIADB, { name: 'Allow RDS Events', url: 'rds.amazonaws.com' }],
  [SERVICE_TYPE.POSTGRESQL, { name: 'Allow RDS Events', url: 'rds.amazonaws.com' }],
]);

const SNS_RETRY_POLICY = {
  defaultHealthyRetryPolicy: {
    minDelayTarget: 20,
    maxDelayTarget: 20,
    numRetries: 3,
    numMaxDelayRetries: 0,
    numNoDelayRetries: 0,
    numMinDelayRetries: 0,
    backoffFunction: 'linear',
  },
  disableSubscriptionOverrides: false,
  defaultThrottlePolicy: {
    maxReceivesPerSecond: 1,
  },
} as const;

/**
 * @type {AwsServiceAlarmResources} the alarms resources
 */
export type AwsServiceAlarmResources = Record<
  string, cloudwatchMetricAlarm.CloudwatchMetricAlarm | TerraformResource
>;

/**
 * @type {AwsAlarmPrerequisites} the prerequisites for alert generators
 */
export type AwsAlarmPrerequisites = {
  topic: snsTopic.SnsTopic;
  policy: snsTopicPolicy.SnsTopicPolicy;
  document: dataAwsIamPolicyDocument.DataAwsIamPolicyDocument;
  subscriptions: snsTopicSubscription.SnsTopicSubscription[];
};

/**
 * @returns {ProviderRequirement} the provider instance requirement for an aws service
 */
const getProviderInstanceRequirement = (): ProviderRequirement => ({
  with: SERVICE_TYPE.PROVIDER,
  requirement: true,
  where: (config: AwsProviderAttributes, linked: BaseServiceAttributes) => (
    config.provider === linked.provider && config.region === linked.region
  ),
  handler: (p: ProviderProvisionable): terraformAwsProvider.AwsProvider => (
    p.provisions.provider
  ),
});

/**
 * @returns {AccountRequirement} the aws account associated with the service
 */
const getAccountRequirement = (): AccountRequirement => ({
  with: SERVICE_TYPE.PROVIDER,
  requirement: true,
  where: (config: BaseServiceAttributes, linked: BaseServiceAttributes) => (
    config.provider === linked.provider && config.region === linked.region
  ),
  handler: (
    prov: ProviderProvisionable,
  ): dataAwsCallerIdentity.DataAwsCallerIdentity => (
    prov.provisions.account
  ),
});

/**
 * @returns {KmsKeyRequirement} the KMS key requirement association
 */
const getKmsKeyRequirement = (): KmsKeyRequirement => ({
  with: SERVICE_TYPE.PROVIDER,
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

/**
 * @returns {VpcRequirement} the VPC requirement for the AWS service
 */
const getVpcRequirement = (): VpcRequirement => ({
  with: SERVICE_TYPE.PROVIDER,
  requirement: true,
  where: (config: BaseServiceAttributes, linked: BaseServiceAttributes) => (
    config.provider === linked.provider && config.region === linked.region
  ),
  handler: (prov: AwsProviderDeployableProvisionable): vpc.Vpc => (
    prov.provisions.vpc
  ),
});

/**
 *
 * @param provisionable
 * @param stack
 * @param linked
 * @returns
 */
export const onServiceLinked = (
  provisionable: LinkableServiceProvisionable, stack: Stack, linked: BaseProvisionable,
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
    account: getAccountRequirement(),
    kmsKey: getKmsKeyRequirement(),
    vpc: getVpcRequirement(),
  },
  destroyable: {
    providerInstance: getProviderInstanceRequirement(),
    account: getAccountRequirement(),
    kmsKey: getKmsKeyRequirement(),
  },
  preparable: {
    providerInstance: getProviderInstanceRequirement(),
    account: getAccountRequirement(),
    kmsKey: getKmsKeyRequirement(),
  },
};

/**
 * @param {MonitoredServiceProvisionable} provisionable the current service's provisionable
 * @param {Stack} stack the stack to provision resources on
 * @returns {AwsAlarmPrerequisites} the prerequisites for alert generator functions
 */
const getMonitoringPrerequisites = (
  provisionable: MonitoredServiceProvisionable, stack: Stack,
): AwsAlarmPrerequisites => {
  const {
    service: { type: targetType },
    config: { name, region, monitoring },
    requirements: { account, providerInstance },
  } = provisionable;

  const topicId = `${name}-${region || 'global'}-${stack.stageName}`;
  const topic = new snsTopic.SnsTopic(stack.context, topicId, {
    name: snakeCase(topicId),
    provider: providerInstance,
    deliveryPolicy: JSON.stringify(SNS_RETRY_POLICY),
  });

  const serviceStatements = [{
    sid: 'Allow CloudWatch Events',
    actions: ['sns:Publish'],
    resources: [topic.arn],
    principals: [{ type: 'Service', identifiers: ['events.amazonaws.com'] }],
  }];

  const serviceIdentifier = AWS_SERVICE_INFO.get(targetType);
  if (serviceIdentifier) {
    serviceStatements.push({
      sid: serviceIdentifier.name,
      actions: ['sns:Publish'],
      resources: [topic.arn],
      principals: [{ type: 'Service', identifiers: [serviceIdentifier.url] }],
    });
  }

  const document = new dataAwsIamPolicyDocument.DataAwsIamPolicyDocument(
    stack.context, `sns-${topicId}-policy-document`, {
    dependsOn: [topic],
    statement: [{
      // Allow the account owner to manage SNS
      sid: 'AllowManageSNS',
      actions: [
        'SNS:Subscribe',
        'SNS:SetTopicAttributes',
        'SNS:RemovePermission',
        'SNS:Receive',
        'SNS:Publish',
        'SNS:ListSubscriptionsByTopic',
        'SNS:GetTopicAttributes',
        'SNS:DeleteTopic',
        'SNS:AddPermission',
      ],
      effect: 'Allow',
      resources: [topic.arn],
      principals: [{
        type: 'AWS',
        identifiers: ['*'],
      }],
      condition: [{
        test: 'StringEquals',
        variable: 'AWS:SourceOwner',
        values: [account.accountId],
      }],
    }],
  });

  const policy = new snsTopicPolicy.SnsTopicPolicy(stack.context, `${topicId}-policy`, {
    arn: topic.arn,
    policy: document.json,
    dependsOn: [document],
  });

  const subscriptions: snsTopicSubscription.SnsTopicSubscription[] = [];

  if (!isEmpty(monitoring.emails)) {
    monitoring.emails.forEach((email) => {
      const hash = hashString(email);

      subscriptions.push(
        new snsTopicSubscription.SnsTopicSubscription(
          stack.context, `${topicId}-subscription-email-${hash}`, {
            topicArn: topic.arn,
            protocol: 'email',
            endpoint: email,
          }),
      );
    });
  }

  if (!isEmpty(monitoring.urls)) {
    monitoring.urls.forEach((url) => {
      const hash = hashString(url);
      const protocol = url.startsWith('https') ? 'https' : 'http';

      subscriptions.push(
        new snsTopicSubscription.SnsTopicSubscription(
          stack.context, `${topicId}-subscription-url-${hash}`, {
          topicArn: topic.arn,
          endpoint: url,
          protocol,
        }),
      );
    });
  }

  return { topic, policy, document, subscriptions };
};

/**
 * @type {AwsServiceAlertsGenerator} describes an alert generator function
 */
export type AwsServiceAlertsGenerator = (
  provisionable: BaseProvisionable,
  stack: Stack,
  resources: BaseProvisionable['provisions'],
  prerequisites: AwsAlarmPrerequisites,
) => AwsServiceAlarmResources;

/**
 * @param {MonitoredServiceProvisionable} provisionable the provisionable to set the alarms for
 * @param {Stack} stack the stack to deploy the resources on
 * @param {AwsServiceAlertsGenerator} alarmsGenerator the alarm generator function
 * @returns {ProvisionResources} the resources to be deployed in the stack
 */
export const withAwsAlarms = <T extends MonitoredServiceProvisionable>(
  provisionable: T, stack: Stack, alarmsGenerator: AwsServiceAlertsGenerator,
) => (resources: T['provisions']): T['provisions'] | T['provisions'] & AwsServiceAlarmResources => {
  const { config: { monitoring } } = provisionable;

  // Monitoring not configured, bail...
  if (isEmpty(monitoring) || (isEmpty(monitoring.emails) && isEmpty(monitoring.urls))) {
    return resources as T['provisions'];
  }

  const prerequisites = getMonitoringPrerequisites(provisionable, stack)
  const alarms = alarmsGenerator(provisionable, stack, resources, prerequisites);

  return {
    ...resources,
    ...alarms,
  };
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
