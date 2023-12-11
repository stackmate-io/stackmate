import { SERVICE_TYPE } from '@src/constants'
import { isObject, isString } from 'lodash'
import type { BaseServiceAttributes } from '@src/services/types'

/**
 * Validates a set of properties to be unique for a part of the schema
 *
 * @param {Any|Object} props the values to validate
 * @param {DataValidationCxt} dataCxt the data validation context
 * @returns {Boolean} whether the domains are unique
 */
export const validateUniqueAppDomains = (serviceConfigs: any): boolean => {
  let hasDuplicate = false
  const domains: Set<string> = new Set()
  const configs = Object.values(serviceConfigs)

  if (!isObject(serviceConfigs) || !configs.every((cfg: BaseServiceAttributes) => !!cfg.type)) {
    // eslint-disable-next-line no-console
    console.warn('The uniqueAppDomains should be attached to environment configurations')
    return true
  }

  configs.forEach((config: BaseServiceAttributes) => {
    if (config.type !== SERVICE_TYPE.APP) {
      return
    }

    if (!('domain' in config) || !config.domain || !isString(config.domain)) {
      return
    }

    if (domains.has(config.domain)) {
      hasDuplicate = true
    }

    domains.add(config.domain)
  })

  return !hasDuplicate
}
