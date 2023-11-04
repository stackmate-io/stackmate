import type { Obj } from '@lib/util'
import type { BaseServiceAttributes, Service } from 'src/services/types'

/**
 * Updates a service given certain attributes
 *
 * @param {Partial<Service>} attrs the service attributes to apply
 * @returns {Function<Service>} the updated service
 */
export const withProperties =
  <C extends BaseServiceAttributes, Attributes extends Obj = Obj>(attrs: Attributes) =>
  <T extends Service<C>>(srv: T): T & Attributes => ({
    ...srv,
    ...attrs,
  })
