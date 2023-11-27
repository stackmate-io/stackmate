import { ProvisionablesMap } from '@src/operation/utils/provisionables'
import { assertRequirementsSatisfied } from '@src/operation/utils/assertRequirementsSatisfied'
import type { Stack } from '@lib/stack'
import type { BaseProvisionable } from '@services/types/provisionable'
import { getAwsServicePrerequisites } from './getAwsServicePrerequisites'

export const getAwsProvisionable = <P extends BaseProvisionable>(
  config: P['config'],
  stack: Stack,
): P => {
  const provisionable = new ProvisionablesMap().create(config)
  const prerequisites = getAwsServicePrerequisites(stack)

  Object.assign(provisionable, {
    requirements: prerequisites,
  })

  assertRequirementsSatisfied(provisionable)

  return provisionable as P
}
