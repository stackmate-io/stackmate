import { isEmpty, difference } from 'lodash'
import type { ServiceConfiguration } from '@core/registry'
import type { DataValidationCxt } from 'ajv/dist/types'

/**
 * Validates a `links` value
 *
 * @param {Any|String[]} links the value for overrides to validate
 * @param {DataValidationCxt} dataCxt the data validation context
 * @returns {Boolean} whether the links value validates
 */
export const validateServiceLinks = (links: any, dataCxt?: DataValidationCxt): boolean => {
  if (isEmpty(links)) {
    return true
  }

  // We should allow service links only for cloud services
  const block = dataCxt?.parentData || {}
  const path = dataCxt?.instancePath || null

  if (!path || !block) {
    return true
  }

  // Get the project's service names
  const serviceNames = path?.match(/[0-9]+\/links/gi)
    ? (dataCxt?.rootData || []).map((cfg: ServiceConfiguration) => cfg.name)
    : []

  // Detect any service names that are not available within the schema
  const irrelevantServices = difference(links, serviceNames)
  return isEmpty(irrelevantServices)
}
