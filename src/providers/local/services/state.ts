import pipe from 'lodash/fp/pipe'
import { join as joinPaths } from 'node:path'
import { LocalBackend } from 'cdktf'
import { SERVICE_TYPE, USER_HOME_DIRECTORY } from '@constants'
import { getLocalService } from '@providers/local/service'
import { withHandler, withSchema } from '@core/service'
import type { Stack } from '@core/stack'
import type { BaseServiceAttributes, Service } from '@core/service'
import type { Provisionable } from '@core/provision'
import type { LocalServiceAssociations, LocalServiceAttributes } from '@providers/local/service'

export type LocalStateResources = { backend: LocalBackend }

export type LocalStateAttributes = LocalServiceAttributes<
  BaseServiceAttributes & {
    type: typeof SERVICE_TYPE.STATE
    path?: string
    directory?: string
  }
>

export type LocalStateService = Service<LocalStateAttributes> & {
  associations: LocalServiceAssociations
}

export type LocalStateProvisionable = Provisionable<LocalStateService, LocalStateResources>

export const resourceHandler = (
  provisionable: LocalStateProvisionable,
  stack: Stack,
): LocalStateResources => {
  const { config } = provisionable
  const path = config.path || `${stack.name}-initial.tfstate`
  const workspaceDir =
    config.directory || joinPaths(USER_HOME_DIRECTORY, stack.name.toLocaleLowerCase())

  const backend = new LocalBackend(stack.context, { path, workspaceDir })
  return { backend }
}

/**
 * @returns {AwsSecretsVaultService} the secrets vault service
 */
export const getStateService = (): LocalStateService =>
  pipe(
    withHandler(resourceHandler),
    withSchema({
      type: 'object',
      properties: {
        path: { type: 'string' },
        directory: { type: 'string' },
      },
    }),
  )(getLocalService(SERVICE_TYPE.STATE))

export const LocalState = getStateService()
