import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity'
import type { ServiceConfiguration } from '@src/services/registry'
import type { Stack } from '@lib/stack'
import type { BaseProvisionable } from '@services/types/provisionable'

DataAwsCallerIdentity

type PrereqsHandler<P extends BaseProvisionable> = (stack: Stack, base?: any) => P['requirements']

export const getAwsProvisionable = <P extends BaseProvisionable>(
  config: ServiceConfiguration,
  stack: Stack,
  additionalPrerequisites: PrereqsHandler<P>,
): P => {
  throw new Error('This method is deprecated and should be removed')
}
