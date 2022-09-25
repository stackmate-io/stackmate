import { TerraformDataSource, TerraformProvider, TerraformResource } from 'cdktf';

import { Stack } from '@stackmate/engine/core/stack';
import { Obj, ChoiceOf } from '@stackmate/engine/lib';
import { ServiceSchema, mergeServiceSchemas } from '@stackmate/engine/core/schema';
import { CLOUD_PROVIDER, PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';

export type ProviderChoice = ChoiceOf<typeof PROVIDER>;
export type CloudProviderChoice = ChoiceOf<typeof CLOUD_PROVIDER>;

type Resource = TerraformResource | TerraformProvider | TerraformDataSource;
export type ProvisionResources = Resource | Resource[];
export type Provisions = Record<string, ProvisionResources>;

export type ServiceTypeChoice = ChoiceOf<typeof SERVICE_TYPE>;
export type ServiceScopeChoice = ChoiceOf<['deployable', 'preparable', 'destroyable']>;

/**
 * @type {Association}
 */
export type Association<Ret = any> = {
  as: string;
  from: ServiceTypeChoice,
  scope: ServiceScopeChoice,
  handler: (provisionable: Provisionable, stack?: Stack) => Ret,
  where?: (config: BaseServiceAttributes, linkedConfig: BaseServiceAttributes) => boolean,
};

/**
 * @type {ServiceAssociation} the configuration object for associating a service with another
 * @param {ServiceTypeChoice}
 * @param {ServiceScopeChoice}
 * @param {Provisions}
 */
export type ServiceAssociation<
  name extends string,
  S extends ServiceTypeChoice,
  C extends ServiceScopeChoice,
  H = any,
> = Association<H> & {
  as: name;
  from: S;
  scope: C;
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
type ExtractAssociation<T extends Association, S extends ServiceScopeChoice> = {
  [K in Extract<T, { scope: S }>['as']]: ReturnType<Extract<T, { as: K }>['handler']>
} extends infer O ? { [K in keyof O]: O[K] } : never;

/**
 * @type {ProvisionAssociationRequirements} calculates the types of the provisionable's requirements
 *  by the return types of the handler functions in the service's associations
 */
export type ProvisionAssociationRequirements<
  Associations extends Association[],
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
  provisions: Provisions,
  resourceId: string; /** @var {String} resourceId the id of the terraform resource */
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
 * @type {ServiceConfiguration} the service configuration after it's been parsed
 */
export type ServiceConfiguration<T extends BaseServiceAttributes = BaseServiceAttributes> = T & {
  id: string;
  name: string;
};

/**
 * @type {Service} accepts a set of service attributes and returns a Service object
 * @param {BaseServiceAttributes}
 * @param {Associations}
 */
export type Service<Setup extends BaseServiceAttributes> = {
  provider: Setup['provider'] extends ProviderChoice ? ProviderChoice : Extract<BaseServiceAttributes, Setup['provider']>;
  type: Setup['type'] extends ServiceTypeChoice ? ServiceTypeChoice: Extract<BaseServiceAttributes, Setup['type']>;
  regions?: readonly string[];
  schemaId: string;
  schema: ServiceSchema<Setup>;
  handlers: Map<ServiceScopeChoice, ProvisionHandler>;
  environment: ServiceEnvironment[];
  associations: Association[];
};

export type BaseService = Service<BaseServiceAttributes>;

/**
 * Returns a base core service (one that cannot be part of a stage)
 *
 * @param provider {ProviderChoice} the provider for the core service
 * @param type {ServiceTypeChoice} the service type for the core service
 * @returns {Service<Obj>} the core service
 */
export const getCoreService = (provider: ProviderChoice, type: ServiceTypeChoice): BaseService => {
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
        errorMessage: `The provider can only be set to "${provider}"`,
        isIncludedInConfigGeneration: true,
      },
      type: {
        type: 'string',
        enum: [type],
        default: type,
        errorMessage: `You have to specify a valid service type, only ${type} is accepted`,
      },
      region: {
        type: 'string',
        isIncludedInConfigGeneration: true,
      },
      name: {
        type: 'string',
        pattern: '[a-zA-Z0-9_]+',
        description: 'The name for the service to deploy',
        errorMessage: 'The name for the service should only contain characters, numbers and underscores',
      },
    },
    errorMessage: {
      _: 'The service configuration is invalid',
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
): BaseService => {
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
export const CORE_SERVICE_TYPES = [SERVICE_TYPE.STATE, SERVICE_TYPE.SECRETS] as ServiceTypeChoice[];

/**
 * @param {ServiceTypeChoice} type the type of service to check whether is a core service
 * @returns {Boolean} whether the given service type is a core service
 */
export const isCoreService = (type: ServiceTypeChoice): boolean => (
  CORE_SERVICE_TYPES.includes(type)
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
 * @param {ServiceAssociation[]} associations the association configurations
 * @see {ServiceAssociation}
 * @returns {Function<Service>}
 */
export const associate = <C extends BaseServiceAttributes, A extends Association[]>(
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
): string => {
  const name = 'name' in config ? config.name : config.type;
  return `${name}-${stageName}`;
};

export const assertRequirementsSatisfied = () => {};
