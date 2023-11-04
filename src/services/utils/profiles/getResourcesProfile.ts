import { DEFAULT_PROFILE_NAME } from '@src/constants'
import { merge } from 'lodash'
import type { ProfilableAttributes } from '@src/services/behaviors'
import type { BaseServiceAttributes } from '@src/services/types'
import { getProfile } from './getProfile'

/**
 * Merges the service's requested profile with any overrides
 *
 * @param {BaseServiceAttributes & ProfilableAttributes} config the service configuration
 * @returns {Object} the result of merging the profile with the service's overrides
 */

export const getResourcesProfile = <
  T extends BaseServiceAttributes & Partial<ProfilableAttributes>,
>(
  config: T,
): Record<string, object> => {
  const { provider, type, profile = DEFAULT_PROFILE_NAME, overrides = {} } = config
  const profileConfig = getProfile(provider, type, profile)

  return merge(profileConfig, overrides)
}
