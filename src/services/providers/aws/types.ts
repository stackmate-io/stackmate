import type {
  ServiceRequirement,
  ServiceAssociations,
  Service,
  BaseServiceAttributes,
  Provisionable,
  Provisions,
} from '@services/types'
import type { TerraformOutput, TerraformResource } from 'cdktf'
import type { Obj } from '@lib/util'
import type { PROVIDER, SERVICE_TYPE } from '@src/constants'
import type {
  MonitoringAttributes,
  ProfilableAttributes,
  RegionalAttributes,
} from '@services/behaviors'
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

export type AwsServiceAttributes<Attrs extends BaseServiceAttributes> = Attrs & {
  provider: typeof PROVIDER.AWS
  region: string
}

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

export type AwsService<
  Attrs extends BaseServiceAttributes,
  Assocs extends ServiceAssociations = Obj,
> = Service<
  AwsServiceAttributes<Attrs>,
  AwsProviderAssociations & AwsNetworkingAssociations & Assocs
>

export type AwsProviderAttributes = AwsServiceAttributes<
  BaseServiceAttributes &
    RegionalAttributes & {
      type: typeof SERVICE_TYPE.PROVIDER
      rootIp?: string
    }
>

export type AwsProviderService = Service<
  AwsProviderAttributes,
  Obj,
  ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY']
>

export type AwsProviderProvisionable = Provisionable<AwsProviderService, AwsProviderResources>

export type AwsNetworkingAttributes = AwsServiceAttributes<
  BaseServiceAttributes &
    ProfilableAttributes &
    RegionalAttributes & {
      type: typeof SERVICE_TYPE.NETWORKING
      rootIp?: string
    }
>

export type AwsNetworkingService = Service<
  AwsServiceAttributes<AwsNetworkingAttributes>,
  AwsProviderAssociations
>

export type AwsNetworkingProvisionable = Provisionable<AwsNetworkingService, AwsNetworkingResources>

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
