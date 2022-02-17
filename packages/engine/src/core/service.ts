import { merge } from 'lodash';
import { Memoize } from 'typescript-memoize';

import Entity from '@stackmate/lib/entity';
import Parser from '@stackmate/lib/parsers';
import Profile from '@stackmate/core/profile';
import { Attribute } from '@stackmate/lib/decorators';
import { CloudService, CloudStack } from '@stackmate/interfaces';
import {
  RegionList, ServiceAssociation, ProviderChoice,
  CloudPrerequisites, ServiceTypeChoice, ResourceProfile, ServiceScopeChoice,
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
   * @var {Array<ServiceAssociation>} associations the list of associations with other services
   *
   * @example
   * [{
   *   lookup: AwsVpcService,
   *   handler: (vpc): void => this.handleVpcAssociated(vpc as AwsVpcService),
   * }];
   */
  readonly associations: Array<ServiceAssociation> = [];

  /**
   * @var {Array<String>} regions the regions that the service is available in
   */
  abstract readonly regions: RegionList;

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

  /**
   * Processes the cloud provider's dependencies. Can be used to extract certain information
   * from the cloud provider's default privisions. (eg. the VPC id from the AWS cloud provider)
   *
   * @param {Array<Service>} dependencies the dependencies provided by the cloud provider
   */
  set dependencies(dependencies: CloudPrerequisites) {
    // overload this function in services that it's required to parse the cloud dependencies
  }

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
   * Associates the current service with the ones mentioned in the `links` section
   *
   * @param {Service} target the service to link the current service with
   */
  public link(target: CloudService) {
    // Find an appropriate handler & run it
    const { handler } = this.associations.find(({ lookup }) => target instanceof lookup) || {};

    if (handler) {
      handler.call(this, target);
    }
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
}

export default Service;
