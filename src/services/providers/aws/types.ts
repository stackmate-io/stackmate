import type { PROVIDER, SERVICE_TYPE } from '@src/constants'
import type { TerraformOutput, TerraformResource } from 'cdktf'
import type { Obj } from '@lib/util'
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
import type {
  ServiceAssociations,
  Service,
  BaseServiceAttributes,
  Provisionable,
  ServiceRequirement,
  Provisions,
} from '@services/types'

export type AwsServiceAttributes<Attrs extends BaseServiceAttributes> = Attrs & {
  provider: typeof PROVIDER.AWS
  region: string
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
    RegionalAttributes & {
      type: typeof SERVICE_TYPE.PROVIDER
      rootIp?: string
    }
>

export type AwsProviderEnvironmentVars = [
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_KMS_KEY_ARN',
]
export type AwsProviderService = Service<AwsProviderAttributes, Obj, AwsProviderEnvironmentVars>
export type AwsProviderProvisionable = Provisionable<AwsProviderService, AwsProviderResources>

export type AwsServiceAssociations = {
  account: ServiceRequirement<
    dataAwsCallerIdentity.DataAwsCallerIdentity,
    typeof SERVICE_TYPE.PROVIDER
  >
  providerInstance: ServiceRequirement<
    terraformAwsProvider.AwsProvider,
    typeof SERVICE_TYPE.PROVIDER
  >
  kmsKey: ServiceRequirement<kmsKey.KmsKey, typeof SERVICE_TYPE.PROVIDER>
  vpc: ServiceRequirement<vpc.Vpc, typeof SERVICE_TYPE.PROVIDER>
}

// Monitoring / Alerting
export type MonitoredServiceProvisionable = Provisionable<
  AwsService<BaseServiceAttributes & MonitoringAttributes>,
  Provisions
>

export type AwsServiceAlertResources = Record<
  string,
  cloudwatchMetricAlarm.CloudwatchMetricAlarm | TerraformResource
>

export type AwsAlertPrerequisites = {
  topic: snsTopic.SnsTopic
  policy: snsTopicPolicy.SnsTopicPolicy
  document: dataAwsIamPolicyDocument.DataAwsIamPolicyDocument
  subscriptions: snsTopicSubscription.SnsTopicSubscription[]
}
