import type { BaseServiceAttributes, ProvisionHandler, Service } from '@services/types'

/**
 * Registers a handler to use when provisioning the service
 *
 * @param {ProvisionHandler} handler the handler that provisions the service
 * @returns {Function<Service>}
 */
export const withHandler =
  <C extends BaseServiceAttributes>(handler: ProvisionHandler) =>
  <T extends Service<C>>(service: T): T => ({
    ...service,
    handler,
  })
