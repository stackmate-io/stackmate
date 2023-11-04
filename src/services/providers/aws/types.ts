import type { MonitoringAttributes, RegionalAttributes } from '@services/behaviors'
import type {
  internetGateway,
  kmsKey as awsKmsKey,
  subnet as awsSubnet,
  vpc as awsVpc,
  provider as awsProvider,
  dataAwsCallerIdentity as callerIdentity,
  snsTopic,
  snsTopicPolicy,
  snsTopicSubscription,
  dataAwsIamPolicyDocument,
  cloudwatchMetricAlarm,
  vpc,
  kmsKey,
  provider as terraformAwsProvider,
  dataAwsCallerIdentity,
} from '@cdktf/provider-aws'
import type { PROVIDER, SERVICE_TYPE } from '@src/constants'
import type { ChoiceOf, Obj } from '@lib/util'
import type {
  ServiceAssociations,
  Service,
  BaseServiceAttributes,
  Provisionable,
  ServiceRequirement,
  Provisions,
} from '@services/types'
import type { TerraformOutput, TerraformResource } from 'cdktf'
import type { REGIONS } from '@aws/constants'

/**
 * @type {AwsServiceAlertResources} the alarms resources
 */

export type AwsServiceAlertResources = Record<
  string,
  cloudwatchMetricAlarm.CloudwatchMetricAlarm | TerraformResource
>
/**
 * @type {AwsAlertPrerequisites} the prerequisites for alert generators
 */

export type AwsAlertPrerequisites = {
  topic: snsTopic.SnsTopic
  policy: snsTopicPolicy.SnsTopicPolicy
  document: dataAwsIamPolicyDocument.DataAwsIamPolicyDocument
  subscriptions: snsTopicSubscription.SnsTopicSubscription[]
}

export type AwsServiceAttributes<Attrs extends BaseServiceAttributes> = Attrs & {
  provider: typeof PROVIDER.AWS
  region: ChoiceOf<typeof REGIONS>
}

export type AwsService<
  Attrs extends BaseServiceAttributes,
  Assocs extends ServiceAssociations = Obj,
> = Service<AwsServiceAttributes<Attrs>, AwsServiceAssociations & Assocs>

export type AwsProviderResources = {
  provider: awsProvider.AwsProvider
  kmsKey: awsKmsKey.KmsKey
  account: callerIdentity.DataAwsCallerIdentity
  outputs: TerraformOutput[]
  gateway: internetGateway.InternetGateway
  subnets: awsSubnet.Subnet[]
  vpc: awsVpc.Vpc
}

export type AwsProviderAttributes = AwsServiceAttributes<
  BaseServiceAttributes &
    RegionalAttributes<ChoiceOf<typeof REGIONS>> & {
      type: typeof SERVICE_TYPE.PROVIDER
      rootIp?: string
    }
>

export type AwsProviderService = Service<AwsProviderAttributes>
export type AwsProviderProvisionable = Provisionable<AwsProviderService, AwsProviderResources>

export type AwsProviderRequirement = ServiceRequirement<
  terraformAwsProvider.AwsProvider,
  typeof SERVICE_TYPE.PROVIDER
>

export type AwsKmsKeyRequirement = ServiceRequirement<kmsKey.KmsKey, typeof SERVICE_TYPE.PROVIDER>

export type AwsVpcRequirement = ServiceRequirement<vpc.Vpc, typeof SERVICE_TYPE.PROVIDER>

export type AwsAccountRequirement = ServiceRequirement<
  dataAwsCallerIdentity.DataAwsCallerIdentity,
  typeof SERVICE_TYPE.PROVIDER
>

export type AwsServiceAssociations = {
  account: AwsAccountRequirement
  providerInstance: AwsProviderRequirement
  kmsKey: AwsKmsKeyRequirement
  vpc: AwsVpcRequirement
}

export type MonitoredServiceProvisionable = Provisionable<
  AwsService<BaseServiceAttributes & MonitoringAttributes>,
  Provisions
>
