import Ajv from 'ajv'
import addErrors from 'ajv-errors'
import addFormats from 'ajv-formats'
import { defaults } from 'lodash'
import { isAddressValid } from '@lib/networking'
import {
  validateServiceProfileOverrides,
  validateServiceLinks,
  validateServiceProfile,
} from '@services/utils'
import { AJV_DEFAULTS } from '@src/validation/constants'
import type { Options as AjvOptions } from 'ajv'

let ajv: Ajv
/**
 * Returns or creates an Ajv instance
 *
 * @param {AjvOptions} opts the options to use with Ajv
 * @returns {Ajv} the Ajv instance
 */

export const getAjv = (opts: AjvOptions = {}): Ajv => {
  if (ajv) {
    return ajv
  }

  ajv = new Ajv(defaults({ ...opts }, AJV_DEFAULTS))

  addFormats(ajv)

  addErrors(ajv, {
    // https://ajv.js.org/packages/ajv-errors.html
    keepErrors: false,
    singleError: false,
  })

  ajv.addKeyword({
    keyword: 'serviceLinks',
    async: false,
    errors: true,
    error: { message: 'Invalid links provided for the service' },
    compile: () => validateServiceLinks,
  })

  ajv.addKeyword({
    keyword: 'serviceProfile',
    type: 'string',
    error: { message: 'Invalid service profile defined' },
    compile: () => validateServiceProfile,
  })

  ajv.addKeyword({
    keyword: 'serviceProfileOverrides',
    type: 'object',
    error: { message: 'Invalid profile overrides defined' },
    compile: () => validateServiceProfileOverrides,
  })

  ajv.addKeyword({
    keyword: 'isIpOrCidr',
    type: 'string',
    error: { message: 'Invalid IP specified' },
    compile: () => isAddressValid,
  })

  return ajv
}
