import { DEFAULT_PROFILE_NAME } from '@src/constants'
import type { BaseServiceAttributes } from '@services/types'
import { withSchema } from './withSchema'

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

export const profileable = <C extends BaseServiceAttributes>(
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
