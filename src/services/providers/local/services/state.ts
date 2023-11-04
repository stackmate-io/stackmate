import { join as joinPaths } from 'node:path'
import pipe from 'lodash/fp/pipe'
import { LocalBackend } from 'cdktf'
import { SERVICE_TYPE } from '@src/constants'
import { withHandler, withSchema } from '@services/behaviors'
import { getLocalService } from '@local/utils/getLocalService'
import type { Stack } from '@lib/stack'
import type { BaseServiceAttributes, Service, Provisionable } from '@services/types'
import type { LocalServiceAssociations, LocalServiceAttributes } from '@local/types'

export type LocalStateResources = { backend: LocalBackend }

export type LocalStateAttributes = LocalServiceAttributes<
  BaseServiceAttributes & {
    type: typeof SERVICE_TYPE.STATE
    fileName?: string
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
  const fileName = config.fileName || `${stack.name}-initial.tfstate`
  const workspaceDir = config.directory || joinPaths(__dirname, stack.name.toLocaleLowerCase())

  const backend = new LocalBackend(stack.context, { path: fileName, workspaceDir })
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
      required: ['directory'],
      properties: {
        fileName: { type: 'string' },
        directory: { type: 'string' },
      },
    }),
  )(getLocalService(SERVICE_TYPE.STATE))

export const LocalState = getStateService()
