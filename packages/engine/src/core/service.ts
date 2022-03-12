import { Memoize } from 'typescript-memoize';
import { isEmpty, isObject, merge } from 'lodash';

import Entity from '@stackmate/lib/entity';
import Parser from '@stackmate/lib/parsers';
import Profile from '@stackmate/core/profile';
import { Attribute } from '@stackmate/lib/decorators';
import { SERVICE_TYPE } from '@stackmate/constants';
import { CloudService, CloudStack, ProviderService, VaultService } from '@stackmate/interfaces';
import {
  RegionList, ServiceAssociation, ProviderChoice,
  ServiceTypeChoice, ResourceProfile, ServiceScopeChoice,
} from '@stackmate/types';

abstract class Service extends Entity implements CloudService {
  /**
   * @var {String} name the service's name
   */
  @Attribute name: string;

  /**
   * @var {String} region the region the service operates in
   */
  @Attribute region: string;

  /**
   * @var {String[]} links the list of service names that the current service
   *                                             is associated (linked) with
   */
  @Attribute links: string[] = [];

  /**
   * @var {String} profile any configuration profile for the service
   */
  @Attribute profile: string = Profile.DEFAULT;

  /**
   * @var {Object} overrides any profile overrides to use
   */
  @Attribute overrides: object = {};

  /**
   * @var {String} projectName the name of the project that the
   */
  @Attribute projectName: string;

  /**
   * @var {String} stageName the name of the stage that the service is deployed to
   */
  @Attribute stageName: string;

  /**
   * @var {Object} regions the regions that the service is available in
   */
  readonly regions: RegionList = {};

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
  abstract get isRegistered(): boolean;

  /**
   * @var {ProviderService} cloudProvider the cloud provider service
   */
  providerService: ProviderService;

  /**
   * @var {Vault} vault the vault service to get credentials from
   */
  vault: VaultService;

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
   * @returns {String} the message to display when the entity is invalid
   */
  public get validationMessage(): string {
    return `Invalid configuration for the ${this.name ? `“${this.name}” ` : ''}${this.type} service`;
  }

  /**
   * @returns {Object} the parsers to apply when setting an object attribute
   */
  parsers() {
    return {
      name: Parser.parseString,
      region: Parser.parseString,
      links: Parser.parseArrayToUniqueValues,
      profile: Parser.parseString,
      overrides: Parser.parseObject,
      projectName: Parser.parseString,
      stageName: Parser.parseString,
    };
  }

  /**
   * Returns the validations for the service
   *
   * @returns {Object} the validations to use
   */
  validations() {
    const validations = {
      name: {
        presence: {
          allowEmpty: false,
          message: 'Every service should have a name',
        },
      },
      links: {
        validateServiceLinks: true,
      },
      profile: {
        validateServiceProfile: {
          provider: this.provider,
          service: this.type,
        },
      },
      overrides: {
        validateProfileOverrides: {
          profile: this.profile,
          provider: this.provider,
          service: this.type,
        },
      },
      projectName: {
        presence: {
          allowEmpty: false,
          message: 'The service should be aware of the project’s name',
        },
      },
      stageName: {
        presence: {
          allowEmpty: false,
          message: 'The service should be aware of the stage’s name',
        },
      },
    };

    // Only require region to be present if the regions attribute is present
    if (isObject(this.regions) && !isEmpty(this.regions)) {
      const regions = Object.values(this.regions);
      Object.assign(validations, {
        region: {
          presence: {
            allowEmpty: false,
            message: 'A region should be provided',
          },
          inclusion: {
            within: regions,
            message: `The region for this service is invalid. Available options are: ${regions.join(', ')}`,
          },
        },
      });
    }

    return validations;
  }

  /**
   * Applies the scope to the service
   *
   * @param scope the scope to apply to the service
   * @returns {CloudService} the service with the scope applied
   */
  scope(scope: ServiceScopeChoice): CloudService {
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
   * @returns {ServiceAssociation[]} the pairs of lookup and handler functions
   */
  @Memoize() public associations(): ServiceAssociation[] {
    const associations: ServiceAssociation[] = [{
      lookup: (srv: CloudService) => (
        srv.type === SERVICE_TYPE.PROVIDER
          && srv.region === this.region
          && srv.provider === this.provider
      ),
      handler: (provider) => this.onProviderRegistered(provider as ProviderService),
    }, {
      lookup: (srv: CloudService) => (srv.type === SERVICE_TYPE.VAULT),
      handler: (vault) => this.onVaultRegistered(vault as VaultService),
    }];

    return associations;
  }

  /**
   * Callback to run when the cloud provider has been registered
   * @param {ProviderService} provider the provider service
   */
  onProviderRegistered(provider: ProviderService): void {
    this.providerService = provider;
  }

  /**
   * Callback to run when the vault service has been registered
   * @param {CloudService} vault the vault service
   */
  onVaultRegistered(vault: VaultService) {
    this.vault = vault;
  }

  /**
   * @param {CloudService} service the service to compare with the current one
   * @returns {Boolean} whether the current service is the same with another one
   */
  isSameWith(service: CloudService): boolean {
    return this.identifier === service.identifier;
  }

  /**
   * @param {CloudService} service the service to check whether the current one is depending on
   * @returns {Boolean} whether the current service is depending upon the provided one
   */
  isDependingUpon(service: CloudService): boolean {
    // We're comparing with the current service itself
    if (this.isSameWith(service)) {
      return false;
    }

    // The target service is included in the links, it is explicitly associated with it
    if (this.links.includes(service.name)) {
      return true;
    }

    // The target service is implicitly linked to the current one
    const linked = this.associations().filter(({ lookup }) => lookup(service));
    return linked.length > 0;
  }

  /**
   * @param {CloudService[]} associated the services associated to the current one
   */
  public link(...associated: CloudService[]) {
    associated.forEach(assoc => this.associate(assoc));
    return this;
  }

  /**
   * Associates the current service with another one
   *
   * @param {Service} target the service to link the current service with
   */
  protected associate(association: CloudService) {
    if (!association.isRegistered) {
      throw new Error(`The service ${association.identifier} which is to be linked to ${this.identifier}, is not registered to the stack yet`);
    }

    if (this.isSameWith(association)) {
      throw new Error(`Attempted to link service ${this.identifier} to itself`);
    }

    if (this.isRegistered) {
      throw new Error(`Service ${this.identifier} is already registered to the stack, we can’t link the service`);
    }

    if (!this.isDependingUpon(association)) {
      throw new Error(`Service ${this.identifier} is not depended upon service of type ${association.type}`);
    }

    // Find the handlers that apply to the associated service
    const assocs = this.associations();
    const handlers = assocs.filter(({ lookup }) => lookup(association)).map(({ handler }) => handler);

    if (isEmpty(handlers)) {
      throw new Error(
        `The service ${this.name} cannot be linked to service ${association.name}, no handlers found`,
      );
    }

    handlers.forEach(handler => handler.call(this, association));
  }
}

export default Service;
