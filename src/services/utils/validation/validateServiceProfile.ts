import { getProfile } from '@core/profile'
import { get } from 'lodash'
import type { DataValidationCxt } from 'ajv/dist/types'

/**
 * Validates a service `profile` value
 *
 * @param {Any|String} profile the value for the profile attribute
 * @param {DataValidationCxt} dataCxt the data validation context
 * @returns {Boolean} whether the service profile validates
 */

export const validateServiceProfile = (profile: any, dataCxt?: DataValidationCxt): boolean => {
  const type = get(dataCxt?.parentData, 'type')
  const provider = get(dataCxt?.parentData, 'provider', get(dataCxt?.rootData, 'provider', null))

  if (!provider || !type) {
    return false
  }

  try {
    getProfile(provider, type, profile)
    return true
  } catch (err) {
    return false
  }
}
