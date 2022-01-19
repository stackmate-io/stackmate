import { isEmpty, merge } from 'lodash';
import { Memoize } from 'typescript-memoize';

import Entity from '@stackmate/lib/entity';
import Profile from '@stackmate/core/profile';
import { Attribute } from '@stackmate/lib/decorators';
import { CloudService, CloudStack, Provisionable } from '@stackmate/interfaces';
import { parseArrayToUniqueValues, parseObject, parseString } from '@stackmate/lib/parsers';
import {
  RegionList, ServiceAssociation, ProviderChoice, CloudPrerequisites,
  ServiceTypeChoice, ProvisioningProfile, ServiceAttributes,
} from '@stackmate/types';

abstract class Service extends Entity implements CloudService, Provisionable {
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
  @Attribute links: Array<string> = [];

  /**
   * @var {String} profile any configuration profile for the service
   */
  @Attribute profile: string = Profile.DEFAULT;

  /**
   * @var {Object} overrides any provisioning profile overrides to use
   */
  @Attribute overrides: object = {};

  /**
   * @var {Construct} stack the stack that the service is provisioned against
   * @protected
   * @readonly
   */
  public stack: CloudStack;

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
   * @returns {Boolean} whether the service is provisioned or not
   */
  abstract get isProvisioned(): boolean;

  /**
   * Provisions the service's resources
   * @abstract
   * @void
   */
  abstract provision(): void;

  /**
   * Processes the cloud provider's dependencies. Can be used to extract certain information
   * from the cloud provider's default privisions. (eg. the VPC id from the AWS cloud provider)
   *
   * @param {Array<Service>} dependencies the dependencies provided by the cloud provider
   */
  public set dependencies(dependencies: CloudPrerequisites) {
    // overload this function in services that it's required to parse the cloud dependencies
  }

  /**
   * @returns {String} the stage's name
   */
  public get stage(): string {
    return this.stack.name;
  }

  /**
   * @returns {String} the service's identifier
   */
  public get identifier(): string {
    return `${this.name}-${this.stage}`;
  }

  /**
   * @returns {Object} the profile to use for provisioning
   */
  @Memoize()
  public get provisioningProfile(): ProvisioningProfile {
    if (!this.profile) {
      return {};
    }

    const profile = Profile.get(this.provider, this.type, this.profile);
    return merge(profile, this.overrides) as ProvisioningProfile;
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
      name: parseString,
      region: parseString,
      links: parseArrayToUniqueValues,
      profile: parseString,
      overrides: parseObject,
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
   * Instantiates, validates and provisions a service
   *
   * @param {ServiceAttributes} attributes the service's attributes
   * @param {Object} stack the terraform stack object
   * @param {Object} prerequisites any prerequisites by the cloud provider
   */
  static factory<T extends Service>(
    this: new (...args: any[]) => T,
    attributes: ServiceAttributes,
    stack: CloudStack,
    prerequisites: CloudPrerequisites = {},
  ): T {
    const service = new this;
    service.attributes = attributes;
    service.stack = stack;

    if (!isEmpty(prerequisites)) {
      service.dependencies = prerequisites;
    }

    service.validate();
    service.provision();

    return service;
  }
}

export default Service;
