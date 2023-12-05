import { ProvisionablesMap } from '@src/operation/provisionables'
import { assertRequirementsSatisfied } from '@src/operation/utils/assertRequirementsSatisfied'
import type { Provisions } from '@src/services/types'
import type { Stack } from '@lib/stack'
import type { BaseProvisionable } from '@services/types/provisionable'
import { getAwsServicePrerequisites } from './getAwsServicePrerequisites'

export const getAwsProvisionable = <P extends BaseProvisionable>(
  config: P['config'],
  stack: Stack,
  prerequisites: Provisions = {},
): P => {
  const provisionable = new ProvisionablesMap().create(config)

  Object.assign(provisionable, {
    requirements: {
      ...getAwsServicePrerequisites(stack),
      ...prerequisites,
    },
  })

  assertRequirementsSatisfied(provisionable)

  return provisionable as P
}
