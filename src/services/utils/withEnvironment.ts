import type { BaseServiceAttributes, Service } from 'src/services/types'

/**
 * Registers the environment variables to use when adding the service to the stack
 *
 * @param {String} name the environment variable's name
 * @param {String} description the environment variable's description
 * @param {Boolean} required whether the variable's presence is required
 * @returns {Function<Service>}
 */
export const withEnvironment =
  <C extends BaseServiceAttributes>(name: string, description: string, required: boolean = true) =>
  <T extends Service<C>>(service: T): T => ({
    ...service,
    environment: [
      ...service.environment,
      {
        name,
        required,
        description,
      },
    ],
  })
