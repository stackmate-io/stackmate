import { ProvisionablesMap } from '@src/operations/utils/provisionables'
import { assertRequirementsSatisfied } from '@src/operations/utils/assertRequirementsSatisfied'
import type { Stack } from '@lib/stack'
import type { BaseProvisionable } from '@services/types/provisionable'
import { getCredentialResources } from './getCredentialResources'
import { getAwsServicePrerequisites } from './getAwsServicePrerequisites'

export const getAwsProvisionable = <P extends BaseProvisionable>(
  config: P['config'],
  stack: Stack,
  { withCredentials = false, withRootCredentials = false } = {},
): P => {
  const provisionable = new ProvisionablesMap().create(config)
  const prerequisites = getAwsServicePrerequisites(stack)

  Object.assign(provisionable, {
    requirements: {
      ...prerequisites,
      ...(withCredentials
        ? { credentials: getCredentialResources(prerequisites, provisionable, stack) }
        : {}),
      ...(withRootCredentials
        ? {
            rootCredentials: getCredentialResources(prerequisites, provisionable, stack, {
              root: true,
            }),
          }
        : {}),
    },
  })

  assertRequirementsSatisfied(provisionable)

  return provisionable as P
}
