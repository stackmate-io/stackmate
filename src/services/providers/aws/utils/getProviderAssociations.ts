import { SERVICE_TYPE } from '@src/constants'
import type { BaseServiceAttributes } from '@services/types'
import type {
  AwsProviderAttributes,
  AwsProviderProvisionable,
  AwsProviderAssociations,
} from '@aws/types'
import type {
  kmsKey,
  provider as terraformAwsProvider,
  dataAwsCallerIdentity,
} from '@cdktf/provider-aws'

const getProviderInstanceRequirement = (): AwsProviderAssociations['providerInstance'] => ({
  with: SERVICE_TYPE.PROVIDER,
  requirement: true,
  where: (config: AwsProviderAttributes, linked: BaseServiceAttributes) =>
    config.provider === linked.provider && config.region === linked.region,
  handler: (p: AwsProviderProvisionable): terraformAwsProvider.AwsProvider =>
    p.provisions.providerInstance,
})

const getAccountRequirement = (): AwsProviderAssociations['account'] => ({
  with: SERVICE_TYPE.PROVIDER,
  requirement: true,
  where: (config: BaseServiceAttributes, linked: BaseServiceAttributes) =>
    config.provider === linked.provider && config.region === linked.region,
  handler: (prov: AwsProviderProvisionable): dataAwsCallerIdentity.DataAwsCallerIdentity =>
    prov.provisions.account,
})

const getKmsKeyRequirement = (): AwsProviderAssociations['kmsKey'] => ({
  with: SERVICE_TYPE.PROVIDER,
  requirement: true,
  where: (config: BaseServiceAttributes, linked: BaseServiceAttributes) =>
    config.provider === linked.provider && config.region === linked.region,
  handler: (prov: AwsProviderProvisionable): kmsKey.KmsKey => prov.provisions.kmsKey,
})

export const getProviderAssociations = (): AwsProviderAssociations => ({
  providerInstance: getProviderInstanceRequirement(),
  account: getAccountRequirement(),
  kmsKey: getKmsKeyRequirement(),
})
