import { TerraformElement, TerraformLocal, TerraformOutput } from 'cdktf';

import { Stack } from '@stackmate/engine/core/stack';
import { Obj, ChoiceOf } from '@stackmate/engine/lib';
import { ServiceSchema, mergeServiceSchemas } from '@stackmate/engine/core/schema';
import { PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';

/**
 * @type {ProviderChoice} a provider choice
 */
export type ProviderChoice = ChoiceOf<typeof PROVIDER>;

/**
 * @type {ServiceTypeChoice} a service type choice
 */
export type ServiceTypeChoice = ChoiceOf<typeof SERVICE_TYPE>;

/**
 * @type {ServiceScopeChoice} the provisioning scopes available
 */
export type ServiceScopeChoice = ChoiceOf<['deployable', 'preparable', 'destroyable']>;

/**
 * @type {Resource} a resource provisioned by the system
 */
export type Resource = TerraformElement;

/**
 * @type {ProvisionResources} types of resources that are provisioned by the handlers
 */
export type ProvisionResources = Resource | Resource[] | Record<string, Resource>;

/**
 * @type {Provisions} the type returned by provision handlers
 */
export type Provisions = Record<string, ProvisionResources> & {
  /**
   * The service's IP address to allow linking with services with
   */
  ip?: TerraformLocal;

  /**
   * The service's outputs
   */
  outputs?: TerraformOutput[];

  /**
   * A resource reference such as a resource's ID to link with services within the same provider
   */
  resourceRef?: TerraformLocal;
};

/**
 * @type {AssociationLookup} the function which determines whether an association takes effect
 */
export type AssociationLookup = (
  config: BaseServiceAttributes, linkedConfig: BaseServiceAttributes,
) => boolean;

/**
 * @type {AssociationHandler} the handler to run when an association takes effect
 */
export type AssociationHandler<
  Ret extends ProvisionResources,
  Attrs extends BaseServiceAttributes = BaseServiceAttributes
> = (
  linked: Provisionable<Attrs>, target: Provisionable<Attrs>, stack: Stack,
) => Ret;

/**
 * @type {Association} describes an association between two services
 */
export type Association<Ret extends ProvisionResources> = {
  scope: ServiceScopeChoice;
  handler: AssociationHandler<Ret>;
  as?: string;
  from?: ServiceTypeChoice;
  where?: AssociationLookup;
  requirement?: true;
};

/**
 * @type {ServiceSideEffect} describes a generic association that is not a requirement
 */
export type ServiceSideEffect = Omit<Association<any>, 'as'> & {
  scope: ServiceScopeChoice;
  handler: AssociationHandler<ProvisionResources>;
  where: AssociationLookup;
  requirement?: false;
};

/**
 * @type {ServiceRequirement} the configuration object for associating a service with another
 * @param {ServiceTypeChoice}
 * @param {ServiceScopeChoice}
 * @param {Provisions}
 */
export type ServiceRequirement<
  name extends string,
  C extends ServiceScopeChoice,
  HandlerReturnType extends ProvisionResources,
  S extends ServiceTypeChoice = never,
> = Association<HandlerReturnType> & {
  as: name;
  scope: C;
  from?: S;
  requirement: true;
};

/**
 * Extracts an association object to an object whose key is the association's name (the "as" key)
 * and value, the return type of the handler function (the "handler" key), whenever the "scope"
 * key is equal to the given scope.
 *
 * @type {ExtractAssociation}
 * @param {Association} T
 * @param {ServiceScopeChoice} S
 */
type ExtractAssociation<
  T extends Association<any>, S extends ServiceScopeChoice, P = Extract<T, { scope: S }>['as']
> = {
  [K in P extends string | symbol ? P : never]: ReturnType<Extract<T, { as: K }>['handler']>
} extends infer O ? { [K in keyof O]: O[K] } : never;

/**
 * @type {ProvisionAssociationRequirements} calculates the types of the provisionable's requirements
 *  by the return types of the handler functions in the service's associations
 */
export type ProvisionAssociationRequirements<
  Associations extends Association<any>[],
  S extends ServiceScopeChoice,
> = ExtractAssociation<Associations[number], S>;

/**
 * @type {Provisionable} represents a piece of configuration and service to be deployed
 */
export type Provisionable<T extends BaseServiceAttributes = BaseServiceAttributes> = {
  id: string;
  config: T;
  service: BaseService;
  requirements: Record<string, any>;
  resourceId: string; /** @var {String} resourceId the id of the terraform resource */
  provisions?: Provisions;
  sideEffects?: Resource[];
};

/**
 * @type {ProvisionHandler} a function that can be used to deploy, prepare or destroy a service
 */
export type ProvisionHandler = (
  provisionable: Provisionable,
  stack: Stack,
  opts?: object,
) => Provisions;

/**
 * @type {ServiceEnvironment} the environment variable required by a service
 */
export type ServiceEnvironment = {
  name: string;
  required: boolean;
  description?: string;
};

/**
 * @type {BaseServiceAttributes} Base attributes for any service in the system
 */
export type BaseServiceAttributes = {
  name: string;
  provider: ProviderChoice;
  type: ServiceTypeChoice;
  region?: string;
};

/**
 * @type {Service} accepts a set of service attributes and returns a Service object
 * @param {BaseServiceAttributes}
 * @param {Associations}
 */
export type Service<Setup extends BaseServiceAttributes> = {
  provider: ProviderChoice;
  type: ServiceTypeChoice;
  regions?: readonly string[];
  schemaId: string;
  schema: ServiceSchema<Setup>;
  handlers: Map<ServiceScopeChoice, ProvisionHandler>;
  environment: ServiceEnvironment[];
  associations: Association<any>[];
};

/**
 * @type {BaseService} base service type
 */
export type BaseService = Service<BaseServiceAttributes>;

/**
 * @type {ExtractAttrs} extracts arguments from a service
 */
export type ExtractAttrs<T> = T extends Service<infer Attrs> ? Attrs : never;

/**
 * Returns a base core service (one that cannot be part of a stage)
 *
 * @param provider {ProviderChoice} the provider for the core service
 * @param type {ServiceTypeChoice} the service type for the core service
 * @returns {Service<Obj>} the core service
 */
export const getCoreService = (
  provider: ProviderChoice, type: ServiceTypeChoice,
): Service<BaseServiceAttributes & { provider: typeof provider; type: typeof type }> => {
  const schemaId = `services/${provider}/${type}`;
  const schema: ServiceSchema<BaseServiceAttributes> = {
    $id: schemaId,
    type: 'object',
    required: [],
    additionalProperties: false,
    properties: {
      provider: {
        type: 'string',
        enum: [provider],
        default: provider,
        isIncludedInConfigGeneration: true,
        errorMessage: {
          enum: `The provider can only be set to "${provider}"`,
        },
      },
      type: {
        type: 'string',
        enum: [type],
        default: type,
        errorMessage: {
          enum: `You have to specify a valid service type, only ${type} is accepted`,
        },
      },
      region: {
        type: 'string',
        isIncludedInConfigGeneration: true,
      },
      name: {
        type: 'string',
        pattern: '^([a-zA-Z0-9_-]+)$',
        minLength: 2,
        description: 'The name for the service to deploy',
        errorMessage: {
          minLength: 'The service’s name should be two characters or more',
          pattern: 'The name property on the service should only contain characters, numbers, dashes and underscores',
        },
      },
    },
  };

  return {
    provider,
    type,
    schema,
    schemaId,
    handlers: new Map(),
    environment: [],
    associations: [],
  };
};

/**
 * Returns a base cloud service (one that can be provisioned in stages)
 *
 * @param provider {ProviderChoice} the provider for the cloud service
 * @param type {ServiceTypeChoice} the service type for the cloud service
 * @returns {Service<Obj>} the cloud service
 */
export const getCloudService = (
  provider: ProviderChoice, type: ServiceTypeChoice,
): Service<BaseServiceAttributes & { provider: typeof provider; type: typeof type }> => {
  const core = getCoreService(provider, type);
  const schema: ServiceSchema<BaseServiceAttributes> = {
    ...core.schema,
    required: [...(core.schema.required || []), 'name', 'type'],
    properties: {
      ...core.schema.properties,
      type: {
        ...(core.schema.properties.type || {}),
        isIncludedInConfigGeneration: true,
      },
      name: {
        ...(core.schema.properties.name || {}),
        minLength: 3,
        isIncludedInConfigGeneration: true,
        serviceConfigGenerationTemplate: '${type}-service-${stageName}',
      },
    },
  };

  return {
    ...core,
    schema,
  };
};

/**
 * @var {ServiceTypeChoice[]} CORE_SERVICE_TYPES the core service types
 */
export const CORE_SERVICE_TYPES = [
  SERVICE_TYPE.STATE, SERVICE_TYPE.SECRETS, SERVICE_TYPE.PROVIDER,
] as ServiceTypeChoice[];

/**
 * @param {ServiceTypeChoice} type the type of service to check whether is a core service
 * @returns {Boolean} whether the given service type is a core service
 */
export const isCoreService = (type: ServiceTypeChoice): boolean => (
  CORE_SERVICE_TYPES.includes(type)
);

/**
 * @param {ProviderChoice} provider the provider to check
 * @returns {Boolean} whether the provider is a cloud provider
 */
export const isCloudProvider = (provider: ProviderChoice): boolean => (
  provider !== PROVIDER.LOCAL
);

/**
 * Updates a service given certain attributes
 *
 * @param {Partial<Service>} attrs the service attributes to apply
 * @returns {Function<Service>} the updated service
 */
export const withServiceProperties = <C extends BaseServiceAttributes, Attributes extends Obj = {}>(
  attrs: Attributes,
) => <T extends Service<C>>(srv: T): T & Attributes => ({
  ...srv,
  ...attrs,
});

/**
 * Adds schema modifications to a service (eg. when adding a new attribute)
 *
 * @param {JsonSchema} mods the schema modifications to apply
 * @returns {Function<Service>}
 */
export const withSchema = <C extends BaseServiceAttributes, Additions extends Obj = {}>(
  mods: ServiceSchema<Additions>,
) => <T extends Service<C>>(srv: T): T & { schema: ServiceSchema<Additions> } => ({
  ...srv,
  schema: mergeServiceSchemas(srv.schema, mods),
});

/**
 * Associates two services.
 * For example:
 *  const AwsRdsService = compose(
 *    ...
 *    associate({
 *      from: SERVICE_TYPE.PROVIDER,
 *      scope: 'deployable',
 *      as: 'kmsKey',
 *      where: (cfg, providerCfg) => cfg.region === providerCfg.region && ....,
 *      handler: (cfg, stack) => stack.getProvisionsFromConfig(cfg).find(p => p instanceof KmsKey),
 *    }),
 *  )
 *
 * Which associate the current service (in our example AwsRdsService) with the "Provider" Service
 * for the `deployable` scope, under the alias `kmsKey`, when the criteria returned by `where`
 * match, using the `handler` function. The `handler` function returns the data to be used
 * as `requirements` when provisioning the service.
 *
 * @param {ServiceRequirement[]} associations the association configurations
 * @see {ServiceRequirement}
 * @returns {Function<Service>}
 */
export const associate = <C extends BaseServiceAttributes, A extends Association<any>[]>(
  associations: A
) => withServiceProperties<C, { associations: A }>({ associations });

/**
 * Registers a handler to use when provisioning the service under a specific scope
 *
 * @param {ServiceScopeChoice} scope the scope to register the handler for
 * @param {ProvisionHandler} handler the handler that provisions the service
 * @returns {Function<Service>}
 */
export const withHandler = <C extends BaseServiceAttributes>(
  scope: ServiceScopeChoice, handler: ProvisionHandler,
) => <T extends Service<C>>(service: T): T => {
  if (service.handlers.has(scope)) {
    throw new Error(`There already is a handler for the “${scope}” scope for the “${service.type}” ${service.provider} service`);
  }

  return {
    ...service,
    handlers: new Map([...Array.from(service.handlers.entries()), [scope, handler]]),
  };
};

/**
 * Registers the environment variables to use when adding the service to the stack
 *
 * @param {String} name the environment variable's name
 * @param {String} description the environment variable's description
 * @param {Boolean} required whether the variable's presence is required
 * @returns {Function<Service>}
 */
export const withEnvironment = <C extends BaseServiceAttributes>(
  name: string, description: string, required: boolean = false,
) => <T extends Service<C>>(service: T): T => ({
  ...service,
  environment: [...service.environment, { name, required, description }],
});

/**
 * @param {BaseServiceAttributes} config the service's configuration
 * @param {String} stageName the stage's name
 * @returns {String} the id to use as a terraform resource identifier
 */
export const getProvisionableResourceId = (
  config: BaseServiceAttributes, stageName: string,
): string => (
  `${config.name || config.type}-${stageName}`
);

/**
 * @param {Provisionable} provisionable the provisionable to check
 * @param {ServiceScopeChoice} scope the scope for the services
 * @throws {Error} if a requirement is not satisfied
 */
export const assertRequirementsSatisfied = (
  provisionable: Provisionable, scope: ServiceScopeChoice,
) => {
  const { service: { associations, type }, requirements } = provisionable;
  associations.filter(
    assoc => assoc.scope === scope && assoc.requirement,
  ).forEach(({ as: name }) => {
    if (!name) {
      throw new Error(`Service ${type} is marked as a requirement but doesn't have a name`);
    }

    if (!requirements[name]) {
      throw new Error(`Requirement ${name} for service ${type} is not satisfied`);
    }
  });
};
