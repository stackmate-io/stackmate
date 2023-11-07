import type { BaseServiceAttributes, Service, ServiceEnvironment } from '@services/types'

type Envs = ServiceEnvironment<string[]>

/**
 * Registers the environment variables to use when adding the service to the stack
 *
 * @param {String} name the environment variable's name
 * @param {String} description the environment variable's description
 * @param {Boolean} required whether the variable's presence is required
 * @returns {Function<Service>}
 */
export const withEnvironment =
  <C extends BaseServiceAttributes, Attributes extends Envs = Envs>(attrs: Attributes) =>
  <T extends Service<C>>(srv: T): T & { environment: Attributes } => ({
    ...srv,
    environment: attrs,
  })
