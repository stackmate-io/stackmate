import type {
  ServiceRequirement,
  Service,
  BaseServiceAttributes,
  Provisionable,
} from '@services/types'
import type { TerraformOutput, TerraformResource } from 'cdktf'
import type { Obj } from '@lib/util'
import type { PROVIDER, SERVICE_TYPE } from '@src/constants'
import type { ProfilableAttributes, RegionalAttributes } from '@services/behaviors'
import type {
  kmsKey as awsKmsKey,
  provider as awsProvider,
  dataAwsCallerIdentity as callerIdentity,
  snsTopic,
  snsTopicPolicy,
  snsTopicSubscription,
  dataAwsIamPolicyDocument,
  cloudwatchMetricAlarm,
  subnet,
  vpc,
  internetGateway,
} from '@cdktf/provider-aws'

export type AwsProviderResources = {
  kmsKey: awsKmsKey.KmsKey
  account: callerIdentity.DataAwsCallerIdentity
  providerInstance: awsProvider.AwsProvider
  outputs: TerraformOutput[]
}

export type AwsNetworkingResources = {
  outputs: TerraformOutput[]
  gateway: internetGateway.InternetGateway
  subnets: subnet.Subnet[]
  vpc: vpc.Vpc
}

export type AwsProviderAssociations = Omit<
  {
    [K in keyof AwsProviderResources]: ServiceRequirement<
      AwsProviderResources[K],
      typeof SERVICE_TYPE.PROVIDER
    >
  },
  'outputs'
>

export type AwsNetworkingAssociations = Omit<
  {
    [K in keyof AwsNetworkingResources]: ServiceRequirement<
      AwsNetworkingResources[K],
      typeof SERVICE_TYPE.NETWORKING
    >
  },
  'outputs'
>

export type AwsProviderAttributes = BaseServiceAttributes &
  RegionalAttributes & {
    provider: typeof PROVIDER.AWS
    type: typeof SERVICE_TYPE.PROVIDER
    rootIp?: string
  }

export type AwsProviderService = Service<
  AwsProviderAttributes,
  Obj,
  ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY']
>

export type AwsProviderProvisionable = Provisionable<AwsProviderService, AwsProviderResources>

export type AwsNetworkingAttributes = BaseServiceAttributes &
  ProfilableAttributes &
  RegionalAttributes & {
    provider: typeof PROVIDER.AWS
    type: typeof SERVICE_TYPE.NETWORKING
    rootIp?: string
  }

export type AwsNetworkingService = Service<AwsNetworkingAttributes, AwsProviderAssociations>

export type AwsNetworkingProvisionable = Provisionable<AwsNetworkingService, AwsNetworkingResources>

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
