import { DEFAULT_PROFILE_NAME } from '@constants'
import type { BaseServiceAttributes } from '@core/services/types/base'
import { withSchema } from './core'

/**
 * @type {Profilable} profile-related attributes
 */

export type ProfilableAttributes = { profile: string; overrides: object }
/**
 * Adds profile support to a service
 *
 * @param {String} defaultProfile the profile to use by default
 * @returns {Function<Service>}
 */

export const profilable = <C extends BaseServiceAttributes>(
  defaultProfile: string = DEFAULT_PROFILE_NAME,
) =>
  withSchema<C, ProfilableAttributes>({
    type: 'object',
    properties: {
      profile: {
        type: 'string',
        default: defaultProfile,
        serviceProfile: true,
      },
      overrides: {
        type: 'object',
        default: {},
        serviceProfileOverrides: true,
      },
    },
  })
