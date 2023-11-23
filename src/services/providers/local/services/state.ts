import { join as joinPaths } from 'node:path'
import pipe from 'lodash/fp/pipe'
import { LocalBackend } from 'cdktf'
import { PROVIDER, SERVICE_TYPE } from '@src/constants'
import { withAssociations, withHandler, withSchema } from '@services/behaviors'
import { getBaseService } from '@src/services/utils'
import { getLocalProviderAssociations } from '@local/utils/getLocalProviderAssociations'
import type { Stack } from '@lib/stack'
import type { BaseServiceAttributes, Service, Provisionable } from '@services/types'
import type { LocalProviderAssociations } from '@local/types'

export type LocalStateResources = { backend: LocalBackend }

export type LocalStateAttributes = BaseServiceAttributes & {
  provider: typeof PROVIDER.LOCAL
  type: typeof SERVICE_TYPE.STATE
  fileName?: string
  directory?: string
}

export type LocalStateService = Service<LocalStateAttributes, LocalProviderAssociations>

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
 * @returns {LocalStateService} the secrets vault service
 */
export const getStateService = (): LocalStateService =>
  pipe(
    withHandler(resourceHandler),
    withSchema({
      type: 'object',
      required: ['fileName', 'directory'],
      properties: {
        fileName: { type: 'string' },
        directory: { type: 'string' },
      },
    }),
    withAssociations(getLocalProviderAssociations()),
  )(getBaseService(PROVIDER.LOCAL, SERVICE_TYPE.STATE))

export const LocalState = getStateService()
