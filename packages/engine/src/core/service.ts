import { Memoize } from 'typescript-memoize';
import { isEmpty, merge } from 'lodash';

import Entity from '@stackmate/lib/entity';
import Parser from '@stackmate/lib/parsers';
import Profile from '@stackmate/core/profile';
import { Attribute } from '@stackmate/lib/decorators';
import { SERVICE_TYPE } from '@stackmate/constants';
import { CloudService, CloudStack } from '@stackmate/interfaces';
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
   * @var {ServiceAssociationDeclarations} links the list of service names that the current service
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
   * @var {Array<String>} regions the regions that the service is available in
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
   * Runs a one-off provision
   *
   * @param {CloudStack} stack the stack to provision the service in
   * @abstract
   * @void
   */
  abstract once(stack: CloudStack): void;

  /**
   * Provisions the service's resources
   *
   * @param {CloudStack} stack the stack to provision the service in
   * @abstract
   * @void
   */
  abstract provision(stack: CloudStack): void;

  destroy(stack: CloudStack): void {}

  /**
   * @returns {String} the service's identifier
   */
  public get identifier(): string {
    return `${this.provider}-${this.name}`.toLowerCase();
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
    return `Invalid configuration for the ${this.name ? `“${this.name}”` : ''} ${this.type} service`;
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
    };
  }

  /**
   * Returns the validations for the service
   *
   * @returns {Object} the validations to use
   */
  validations() {
    const regions = Object.values(this.regions);

    return {
      name: {
        presence: {
          allowEmpty: false,
          message: 'Every service should have a name',
        },
      },
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
    };
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
        handlerFunction = this.once;
        break;
      case 'provisionable':
        handlerFunction = this.provision;
        break;
      case 'destroyable':
        handlerFunction = this.destroy;
        break;
      default:
        throw new Error(`Scope ${scope} is invalid`);
    }

    Reflect.set(this, 'register', new Proxy(this.register, {
      apply: (_target, thisArg, args: [stack: CloudStack]) => {
        return handlerFunction.apply(thisArg, args);
      },
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

  @Memoize() public associations(): ServiceAssociation[] {
    // Start populating the associations by adding the cloud provider, state and vault
    return [{
      lookup: (srv: CloudService) => (
        srv.type === SERVICE_TYPE.PROVIDER && srv.region === this.region && srv.provider === this.provider
      ),
      handler: () => {},
    }, {
      lookup: (srv: CloudService) => (srv.type === SERVICE_TYPE.STATE),
      handler: () => {}
    }, {
      lookup: (srv: CloudService) => (srv.type === SERVICE_TYPE.VAULT),
      handler: () => {},
    }];
  }

  /**
   * @param {CloudService} service the service to check whether the current one is depending on
   * @returns {Boolean} whether the current service is depending upon the provided one
   */
  isDependingOn(service: CloudService): boolean {
    // We're comparing with the current service itself
    if (this.identifier === service.identifier) {
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
   * Associates the current service with the ones mentioned in the `links` section
   *
   * @param {Service} target the service to link the current service with
   * @void
   */
  public link(target: CloudService) {
    // Find the handlers that apply to the associated service
    const handlers = this.associations().filter(
      ({ lookup }) => lookup(target),
    ).map(
      ({ handler }) => handler,
    );

    if (isEmpty(handlers)) {
      throw new Error(
        `The service ${this.name} cannot be linked to service ${target.name}, no handlers found`,
      );
    }

    handlers.forEach(handler => handler.call(this, target));
  }
}

export default Service;
