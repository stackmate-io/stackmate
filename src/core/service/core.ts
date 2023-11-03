import { merge } from 'lodash'
import { mergeServiceSchemas } from '@core/schema'
import type { TerraformElement, TerraformLocal, TerraformOutput } from 'cdktf'
import type { Stack } from '@core/stack'
import type { Obj, ChoiceOf } from '@lib/util'
import type { PROVIDER, SERVICE_TYPE } from '@constants'
import type { ServiceSchema, JsonSchema } from '@core/schema'

/**
 * @type {ProviderChoice} a provider choice
 */
export type ProviderChoice = ChoiceOf<typeof PROVIDER>

/**
 * @type {ServiceTypeChoice} a service type choice
 */
export type ServiceTypeChoice = ChoiceOf<typeof SERVICE_TYPE>

/**
 * @type {Resource} a resource provisioned by the system
 */
export type Resource = TerraformElement

/**
 * @type {ProvisionResources} types of resources that are provisioned by the handlers
 */
export type ProvisionResources = Resource | Resource[] | Record<string, Resource>

/**
 * @type {Provisions} the type returned by provision handlers
 */
export type Provisions = Record<string, ProvisionResources> & {
  /**
   * The service's IP address to allow linking with services with
   */
  ip?: TerraformLocal

  /**
   * The service's outputs
   */
  outputs?: TerraformOutput[]

  /**
   * A resource reference such as a resource's ID to link with services within the same provider
   */
  resourceRef?: TerraformLocal
}

/**
 * @type {AssociationReturnType} the return types for association handlers
 */
export type AssociationReturnType = ProvisionResources | void

/**
 * @type {AssociationLookup} the function which determines whether an association takes effect
 */
export type AssociationLookup = (
  config: BaseServiceAttributes,
  linkedConfig: BaseServiceAttributes,
) => boolean

/**
 * @type {AssociationHandler} the handler to run when an association takes effect
 */
export type AssociationHandler<
  Ret extends AssociationReturnType,
  Prov extends BaseProvisionable = BaseProvisionable,
  Opts extends Obj = Obj,
> = (current: Prov, stack: Stack, linked: BaseProvisionable, opts?: Opts) => Ret

/**
 * @type {Association} describes an association between two services
 */
export type Association<Ret extends AssociationReturnType> = {
  handler: AssociationHandler<Ret>
  where?: AssociationLookup
  with?: ServiceTypeChoice
  requirement?: boolean
  sideEffect?: boolean
}

/**
 * @type {AnyAssociationHandler} describes any association hhandler
 */
export type AnyAssociationHandler = AssociationHandler<AssociationReturnType>

/**
 * @type {ServiceRequirement} the configuration object for associating a service with another
 * @param {ProvisionResources} Ret the handler's return type
 * @param {ServiceTypeChoice} S the service type choice the association refers to (optional)
 */
export type ServiceRequirement<
  Ret extends AssociationReturnType,
  S extends ServiceTypeChoice = never,
> = Association<Ret> & { requirement: true; with?: S }

/**
 * @type {ServiceSideEffect} describes a generic association that is not a requirement
 */
export type ServiceSideEffect<Ret extends AssociationReturnType = ProvisionResources> =
  Association<Ret> & {
    where?: AssociationLookup
    sideEffect: true
  }

/**
 * @type {ServiceAssociations} the service's associations
 */
export type ServiceAssociations = Record<string, Association<any>>

/**
 * @type {ExtractServiceRequirements} extracts service requirements from its associations
 */
type ExtractServiceRequirements<Associations extends ServiceAssociations> = {
  [K in keyof Associations]: Associations[K] extends infer A extends Association<any>
    ? A['requirement'] extends true
      ? ReturnType<A['handler']>
      : never
    : never
}

/**
 * @type {BaseProvisionable} base provisionable
 */
export type BaseProvisionable<Attrs extends BaseServiceAttributes = BaseServiceAttributes> = {
  id: string
  service: BaseService
  config: Attrs
  provisions: Provisions
  resourceId: string
  registered: boolean
  sideEffects: Provisions
  requirements: Record<string, ProvisionResources>
}

/**
 * @type {Provisionable} represents a piece of configuration and service to be deployed
 */
export type Provisionable<
  Srv extends BaseService,
  Provs extends Provisions,
  Context extends Obj = Obj,
  Attrs extends BaseServiceAttributes = ExtractAttrs<Srv>,
> = BaseProvisionable<Attrs> & {
  service: Srv
  config: Attrs
  provisions: Provs
  context: Context
  requirements: ExtractServiceRequirements<Srv['associations']>
}

/**
 * @type {ProvisionHandler} a function that can be used to deploy, prepare or destroy a service
 */
export type ProvisionHandler = (
  provisionable: BaseProvisionable,
  stack: Stack,
  opts?: object,
) => Provisions

/**
 * @type {ServiceEnvironment} the environment variable required by a service
 */
export type ServiceEnvironment = {
  name: string
  required: boolean
  description?: string
}

/**
 * @type {BaseServiceAttributes} Base attributes for any service in the system
 */
export type BaseServiceAttributes = {
  name: string
  provider: ProviderChoice
  type: ServiceTypeChoice
  region?: string
}

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
  schema: ServiceSchema<Setup>
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
 * @returns {JsonSchema} the service's name schema
 */
export const getServiceNameSchema = (): JsonSchema<BaseServiceAttributes['name']> => ({
  type: 'string',
  pattern: '^([a-zA-Z0-9_-]+)$',
  minLength: 2,
  description: 'The name for the service to deploy',
  errorMessage: {
    minLength: 'The service’s name should be two characters or more',
    pattern:
      'The name property on the service should only contain characters, numbers, dashes and underscores',
  },
})

/**
 * @param {ProviderChoice[]} providers the providers to allow in the schema
 * @param {ProviderChoice} defaultProvider the default provider for the service
 * @returns {JsonSchema} the provider's schema
 */
export const getServiceProviderSchema = (
  providers: ProviderChoice[],
  defaultProvider?: ProviderChoice,
): JsonSchema<ProviderChoice> => ({
  type: 'string',
  enum: providers,
  default: defaultProvider,
  errorMessage: {
    enum: `The provider is invalid, available choices are: ${providers.join(', ')}`,
  },
})

/**
 * @param {ServiceTypeChoice[]} types the service types available
 * @param {ServiceTypeChoice} defaultType the default type for the service
 * @returns {JsonSchema} the service's type schema
 */
export const getServiceTypeSchema = (
  types: ServiceTypeChoice[],
): JsonSchema<ServiceTypeChoice> => ({
  type: 'string',
  enum: types,
  errorMessage: {
    enum: `You have to specify a valid service type, available are: ${types.join(', ')}`,
  },
})

/**
 * Returns a base core service (one that cannot be part of the services list)
 *
 * @param provider {ProviderChoice} the provider for the core service
 * @param type {ServiceTypeChoice} the service type for the core service
 * @returns {Service<Obj>} the core service
 */
export const getCoreService = (
  provider: ProviderChoice,
  type: ServiceTypeChoice,
): Service<BaseServiceAttributes & { provider: typeof provider; type: typeof type }> => {
  const schemaId = `services/${provider}/${type}`
  const schema: ServiceSchema<BaseServiceAttributes> = {
    $id: schemaId,
    type: 'object',
    required: [],
    additionalProperties: false,
    properties: {
      name: getServiceNameSchema(),
      provider: getServiceProviderSchema([provider], provider),
      type: getServiceTypeSchema([type]),
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
 * Returns a base cloud service (one that can be provisioned in the services list)
 *
 * @param provider {ProviderChoice} the provider for the cloud service
 * @param type {ServiceTypeChoice} the service type for the cloud service
 * @returns {Service<Obj>} the cloud service
 */
export const getCloudService = (
  provider: ProviderChoice,
  type: ServiceTypeChoice,
): Service<BaseServiceAttributes & { provider: typeof provider; type: typeof type }> => {
  const core = getCoreService(provider, type)
  const schema: ServiceSchema<BaseServiceAttributes> = {
    ...core.schema,
    required: [...(core.schema.required || []), 'name', 'type'],
    properties: {
      ...core.schema.properties,
      name: {
        ...(core.schema.properties.name || {}),
        minLength: 3,
      },
    },
  }

  return {
    ...core,
    schema,
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
  <C extends BaseServiceAttributes, Additions extends Obj = Obj>(mods: ServiceSchema<Additions>) =>
  <T extends Service<C>>(srv: T): T & { schema: ServiceSchema<Additions> } => ({
    ...srv,
    schema: mergeServiceSchemas(srv.schema, mods),
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
  <C extends BaseServiceAttributes>(name: string, description: string, required: boolean = false) =>
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
