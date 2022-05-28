import { Memoize } from 'typescript-memoize';
import { get, has, isEmpty, merge } from 'lodash';

import Entity from '@stackmate/engine/lib/entity';
import Profile from '@stackmate/engine/core/profile';
import { DEFAULT_PROFILE_NAME, PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';
import {
  ProviderChoice, ServiceTypeChoice, ResourceProfile, ServiceScopeChoice, ServiceAssociations,
  CloudStack, BaseService, BaseServices, CloudServiceConfiguration,
} from '@stackmate/engine/types';

abstract class Service<Attrs = BaseService.Attributes> extends Entity<Attrs> implements BaseService.Type {
  /**
   * @var {String} name the service's name
   */
  name: string;

  /**
   * @var {String[]} links the list of service names that the current service
   *                                             is associated (linked) with
   */
  links: string[] = [];

  /**
   * @var {String} profile any configuration profile for the service
   */
  profile: string = DEFAULT_PROFILE_NAME;

  /**
   * @var {Object} overrides any profile overrides to use
   */
  overrides: object = {};

  /**
   * @var {String} projectName the name of the project that the
   */
  projectName: string;

  /**
   * @var {String} stageName the name of the stage that the service is deployed to
   */
  stageName: string;

  /**
   * @var {String} type the service's type
   * @abstract
   * @readonly
   */
  abstract readonly type: ServiceTypeChoice;

  /**
   * @var {String} provider the service's cloud provider
   * @abstract
   * @readonly
   */
  abstract readonly provider: ProviderChoice;

  /**
   * @returns {Boolean} whether the service is registered in the stack
   */
  abstract isRegistered(): boolean;

  /**
   * @var {ProviderService} providerService the cloud provider service
   */
  providerService: BaseServices.Provider.Type;

  /**
   * @var {Vault} vault the vault service to get credentials from
   */
  vault: BaseServices.Vault.Type;

  /**
   * Provisioning when we initially prepare a stage
   *
   * @param {CloudStack} stack the stack to provision the service in
   */
  onPrepare(stack: CloudStack): void {
    // no-op. most services are not required when preparing the stage
  }

  /**
   * Provisioning when we deploy a stage
   *
   * @param {CloudStack} stack the stack to provision the service in
   */
  abstract onDeploy(stack: CloudStack): void;

  /**
   * Provisioning on when we destroy destroy a stage
   *
   * @param {CloudStack} stack the stack to provision the service in
   * @abstract
   */
  onDestroy(stack: CloudStack): void {
    // no-op. this just removes the resources from the stack
  }

  /**
   * @returns {String} the service's identifier
   */
  public get identifier(): string {
    return `${this.name}-${this.stageName}`.toLowerCase();
  }

  /**
   * @returns {Object} the profile to use for the resources
   */
  @Memoize() public get resourceProfile(): ResourceProfile {
    if (!this.profile) {
      return {};
    }

    const profile = Profile.get(this.provider, this.type, this.profile);
    return merge(profile, this.overrides) as ResourceProfile;
  }

  /**
   * Applies the scope to the service
   *
   * @param scope the scope to apply to the service
   * @returns {BaseService.Type} the service with the scope applied
   */
  scope(scope: ServiceScopeChoice): BaseService.Type {
    let handlerFunction: (stack: CloudStack) => void;

    switch(scope) {
      case 'preparable':
        handlerFunction = this.onPrepare.bind(this);
        break;
      case 'deployable':
        handlerFunction = this.onDeploy.bind(this);
        break;
      case 'destroyable':
        handlerFunction = this.onDestroy.bind(this);
        break;
      default:
        throw new Error(`Scope ${scope} is invalid`);
    }

    Reflect.set(this, 'register', new Proxy(this.register, {
      apply: (_target, thisArg, args: [stack: CloudStack]) => (
        handlerFunction.apply(thisArg, args)
      ),
    }));

    return this;
  }

  /**
   * Registers the service in the stack
   *
   * @param {CloudStack} stack the stack to provision
   */
  register(stack: CloudStack) {
    throw new Error('No scope has been applied, you have to use the `scope` method first');
  }

  /**
   * @returns {ServiceAssociations} the pairs of lookup and handler functions
   */
  @Memoize() public associations(): ServiceAssociations {
    return {
      [SERVICE_TYPE.PROVIDER]: [(p: BaseServices.Provider.Type) => this.onProviderRegistered(p)],
      [SERVICE_TYPE.VAULT]: [(v: BaseServices.Vault.Type) => this.onVaultRegistered(v)],
    }
  }

  /**
   * Callback to run when the cloud provider has been registered
   * @param {ProviderService} provider the provider service
   */
  onProviderRegistered(srv: BaseServices.Provider.Type): void {
    if (srv.type !== SERVICE_TYPE.PROVIDER) {
      return;
    }

    if (srv.provider !== this.provider) {
      return;
    }

    this.providerService = srv;
  }

  /**
   * Callback to run when the vault service has been registered
   * @param {CloudService} vault the vault service
   */
  onVaultRegistered(srv: BaseServices.Vault.Type) {
    if (srv.type !== SERVICE_TYPE.VAULT) {
      return;
    }

    if (srv.provider !== this.provider) {
      return;
    }

    this.vault = srv;
  }

  /**
   * @param {CloudService} service the service to compare with the current one
   * @returns {Boolean} whether the current service is the same with another one
   */
  isSameWith(service: BaseService.Type): boolean {
    return this.identifier === service.identifier;
  }

  /**
   * @param {CloudService} service the service to check whether the current one is depending on
   * @returns {Boolean} whether the current service is depending upon the provided one
   */
  isDependingUpon(service: BaseService.Type): boolean {
    // We're comparing with the current service itself
    if (this.isSameWith(service)) {
      return false;
    }

    // The target service is included in the links, it is explicitly associated with it
    if (this.links.includes(service.name)) {
      return true;
    }

    // The target service is implicitly linked to the current one
    return has(this.associations(), service.type);
  }

  /**
   * @param {CloudService[]} associated the services associated to the current one
   */
  public link(...associated: BaseService.Type[]): BaseService.Type {
    associated.forEach(assoc => this.associate(assoc));
    return this;
  }

  /**
   * Associates the current service with another one
   *
   * @param {Service} target the service to link the current service with
   */
  protected associate(association: BaseService.Type) {
    if (!association.isRegistered()) {
      throw new Error(`The service ${association.identifier} which is to be linked to ${this.identifier}, is not registered to the stack yet`);
    }

    if (this.isSameWith(association)) {
      throw new Error(`Attempted to link service ${this.identifier} to itself`);
    }

    if (this.isRegistered()) {
      throw new Error(`Service ${this.identifier} is already registered to the stack, we can’t link the service`);
    }

    if (!this.isDependingUpon(association)) {
      throw new Error(`Service ${this.identifier} is not depended upon service of type ${association.type}`);
    }

    // Find the handlers that apply to the associated service
    const handlers = get(this.associations(), association.type);

    if (isEmpty(handlers)) {
      throw new Error(
        `The service ${this.name} cannot be linked to service ${association.name}, no handlers found`,
      );
    }

    handlers.forEach(handler => handler.call(this, association));
  }

  /**
   * @returns {Object} provides the structure to generate the JSON schema by
   */
  static schema(): BaseService.Schema {
    const providers = Object.values(PROVIDER);
    const services = Object.values(SERVICE_TYPE);

    return {
      type: 'object',
      properties: {
        provider: {
          type: 'string',
          enum: providers,
          errorMessage: `You have to specify a valid provider. Available options are: ${providers.join(', ')}`,
        },
        type: {
          type: 'string',
          enum: services,
          errorMessage: `You have to specify a valid service type. Available options are: ${services.join(', ')}`,
        },
        name: {
          type: 'string',
          pattern: '[a-z0-9_]+',
          description: 'The name for the service to deploy',
        },
        profile: {
          type: 'string',
          default: DEFAULT_PROFILE_NAME,
          serviceProfile: true,
        },
        links: {
          type: 'array',
          default: [],
          serviceLinks: true,
          items: { type: 'string' },
        },
        overrides: {
          type: 'object',
          default: {},
          serviceProfileOverrides: true,
        },
      },
      required: ['provider', 'name'],
      errorMessage: {
        _: 'The service configuration is invalid',
        properties: {
          name: 'The name for the service should only contain characters, numbers and underscores',
        },
        required: {
          name: 'You have to specify a name for the service'
        },
      },
    };
  }

  /**
   * Returns the attributes to use when populating the initial configuration
   * @param {Object} options the options for the configuration
   * @returns {Object} the attributes
   */
  static config() {
    throw new Error('The config() method is not available for this service');
  }
}

export default Service;
