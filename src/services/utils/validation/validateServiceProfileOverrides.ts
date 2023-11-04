import { DEFAULT_PROFILE_NAME } from '@src/constants'
import { getProfile } from '@core/profile'
import { get, difference, isEmpty } from 'lodash'
import type { DataValidationCxt } from 'ajv/dist/types'

/**
 * Validates a profile `overrides` value
 *
 * @param {Any|Object} overrides the value for overrides to validate
 * @param {DataValidationCxt} dataCxt the data validation context
 * @returns {Boolean} whether the overrides value validates
 */

export const validateServiceProfileOverrides = (
  overrides: any,
  dataCxt?: DataValidationCxt,
): boolean => {
  const type = get(dataCxt?.parentData, 'type')
  const profile = get(dataCxt?.parentData, 'profile', DEFAULT_PROFILE_NAME)
  const provider = get(dataCxt?.parentData, 'provider', get(dataCxt?.rootData, 'provider', null))

  if (!provider || !type) {
    return false
  }

  try {
    const serviceOverrides = getProfile(provider, type, profile)
    const irrelevantKeys = difference(Object.keys(overrides), Object.keys(serviceOverrides))
    return isEmpty(irrelevantKeys)
  } catch (err) {
    return false
  }
}
