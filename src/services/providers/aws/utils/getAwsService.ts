import pipe from 'lodash/fp/pipe'
import { PROVIDER, SERVICE_TYPE } from '@src/constants'
import { REGIONS } from '@aws/constants'
import { getBaseService } from '@services/utils'
import { withAssociations, withRegions } from '@services/behaviors'
import type {
  vpc,
  kmsKey,
  provider as terraformAwsProvider,
  dataAwsCallerIdentity,
} from '@cdktf/provider-aws'
import type { BaseServiceAttributes, ServiceTypeChoice } from '@services/types'
import type {
  AwsAccountRequirement,
  AwsProviderAttributes,
  AwsProviderProvisionable,
  AwsServiceAssociations,
  AwsKmsKeyRequirement,
  AwsProviderRequirement,
  AwsVpcRequirement,
} from '@aws/types'

/**
 * @returns {AwsProviderRequirement} the provider instance requirement for an aws service
 */
const getProviderInstanceRequirement = (): AwsProviderRequirement => ({
  with: SERVICE_TYPE.PROVIDER,
  requirement: true,
  where: (config: AwsProviderAttributes, linked: BaseServiceAttributes) =>
    config.provider === linked.provider && config.region === linked.region,
  handler: (p: AwsProviderProvisionable): terraformAwsProvider.AwsProvider => p.provisions.provider,
})

/**
 * @returns {AwsAccountRequirement} the aws account associated with the service
 */
const getAccountRequirement = (): AwsAccountRequirement => ({
  with: SERVICE_TYPE.PROVIDER,
  requirement: true,
  where: (config: BaseServiceAttributes, linked: BaseServiceAttributes) =>
    config.provider === linked.provider && config.region === linked.region,
  handler: (prov: AwsProviderProvisionable): dataAwsCallerIdentity.DataAwsCallerIdentity =>
    prov.provisions.account,
})

/**
 * @returns {AwsKmsKeyRequirement} the KMS key requirement association
 */
const getKmsKeyRequirement = (): AwsKmsKeyRequirement => ({
  with: SERVICE_TYPE.PROVIDER,
  requirement: true,
  where: (config: BaseServiceAttributes, linked: BaseServiceAttributes) =>
    config.provider === linked.provider && config.region === linked.region,
  handler: (prov: AwsProviderProvisionable): kmsKey.KmsKey => prov.provisions.kmsKey,
})

/**
 * @returns {AwsVpcRequirement} the VPC requirement for the AWS service
 */
const getVpcRequirement = (): AwsVpcRequirement => ({
  with: SERVICE_TYPE.PROVIDER,
  requirement: true,
  where: (config: BaseServiceAttributes, linked: BaseServiceAttributes) =>
    config.provider === linked.provider && config.region === linked.region,
  handler: (prov: AwsProviderProvisionable): vpc.Vpc => prov.provisions.vpc,
})

/**
 * @var {AwsServiceAssociations} associations every AWS service's associations
 */
const associations: AwsServiceAssociations = {
  providerInstance: getProviderInstanceRequirement(),
  account: getAccountRequirement(),
  kmsKey: getKmsKeyRequirement(),
  vpc: getVpcRequirement(),
}

export const getAwsService = (type: ServiceTypeChoice) =>
  pipe(withAssociations(associations), withRegions(REGIONS))(getBaseService(PROVIDER.AWS, type))
