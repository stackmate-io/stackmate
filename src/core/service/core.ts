import { merge } from 'lodash'
import { mergeSchemas } from '@lib/schema'
import { getNameSchema, getProviderSchema, getTypeSchema } from '@services/utils/schema'
import type { ServiceAssociations } from '@core/services/types/association'
import type { BaseServiceAttributes, ServiceEnvironment } from '@core/services/types/util'
import type { ServiceTypeChoice, ProviderChoice } from '@core/services/types'
import type { Obj } from '@lib/util'
import type { JsonSchema } from '@lib/schema'
import type { ProvisionHandler } from '@core/services/types/provisionable'

/**
 * @type {Service} accepts a set of service attributes and returns a Service object
 * @param {BaseServiceAttributes}
 * @param {Associations}
 */
export type Service<
  Setup extends BaseServiceAttributes,
  Associations extends ServiceAssociations = Obj,
> = {
  provider: ProviderChoice
  type: ServiceTypeChoice
  regions?: readonly string[]
  schemaId: string
  schema: JsonSchema<Setup>
  environment: ServiceEnvironment[]
  handler: ProvisionHandler
  associations: Associations
}

/**
 * @type {BaseService} base service type
 */
export type BaseService = Service<BaseServiceAttributes>

/**
 * @type {ExtractAttrs} extracts arguments from a service
 */
export type ExtractAttrs<T> = T extends Service<infer Attrs> ? Attrs : never

/**
 * @type {WithAssociations} returns a service with additional associations
 */
export type WithAssociations<T extends BaseService, A extends ServiceAssociations> = T & {
  associations: A
}

/**
 * Returns a base core service (one that cannot be part of the services list)
 *
 * @param provider {ProviderChoice} the provider for the core service
 * @param type {ServiceTypeChoice} the service type for the core service
 * @returns {Service<Obj>} the core service
 */
export const getBaseService = (
  provider: ProviderChoice,
  type: ServiceTypeChoice,
): Service<BaseServiceAttributes & { provider: typeof provider; type: typeof type }> => {
  const schemaId = `services/${provider}/${type}`
  const schema: JsonSchema<BaseServiceAttributes> = {
    $id: schemaId,
    type: 'object',
    required: ['name', 'type', 'provider'],
    additionalProperties: false,
    properties: {
      name: getNameSchema(),
      provider: getProviderSchema([provider], provider),
      type: getTypeSchema([type]),
      region: { type: 'string' },
    },
  }

  return {
    provider,
    type,
    schema,
    schemaId,
    environment: [],
    associations: {},
    handler: () => {
      throw new Error('You have to register a handler for the service')
    },
  }
}

/**
 * Updates a service given certain attributes
 *
 * @param {Partial<Service>} attrs the service attributes to apply
 * @returns {Function<Service>} the updated service
 */
export const withServiceProperties =
  <C extends BaseServiceAttributes, Attributes extends Obj = Obj>(attrs: Attributes) =>
  <T extends Service<C>>(srv: T): T & Attributes => ({
    ...srv,
    ...attrs,
  })

/**
 * Adds schema modifications to a service (eg. when adding a new attribute)
 *
 * @param {JsonSchema} mods the schema modifications to apply
 * @returns {Function<Service>}
 */
export const withSchema =
  <C extends BaseServiceAttributes, Additions extends Obj = Obj>(mods: JsonSchema<Additions>) =>
  <T extends Service<C>>(srv: T): T & { schema: JsonSchema<Additions> } => ({
    ...srv,
    schema: mergeSchemas(srv.schema, mods),
  })

/**
 * Associates two services.
 * For example:
 *  const AwsRdsService = compose(
 *    ...
 *    associate({
 *      associationName: {
 *        with: SERVICE_TYPE.PROVIDER,
 *        where: (cfg, providerCfg) => cfg.region === providerCfg.region && ....,
 *        handler: (p, stack) => p.provisions.find(p => p instanceof KmsKey),
 *      },
 *      // ...
 *    }),
 *  )
 *
 * Which associate the current service (in our example AwsRdsService) with the "Provider" Service
 * under the alias `kmsKey`, when the criteria returned by `where` match,
 * using the `handler` function. The `handler` function returns the data to be used
 * as `requirements` when provisioning the service.
 *
 * @param {ServiceAssociations} associations the association configurations
 * @returns {Function<Service>}
 */
export const associate =
  <C extends BaseServiceAttributes, A extends ServiceAssociations>(associations: A) =>
  <T extends Service<C>>(service: T): WithAssociations<T, A> => ({
    ...service,
    associations: merge({}, service.associations, associations),
  })

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
