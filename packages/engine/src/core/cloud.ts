import { get, snakeCase, isNil } from 'lodash';

import Entity from '@stackmate/lib/entity';
import Registry from '@stackmate/core/registry';
import { Attribute } from '@stackmate/lib/decorators';
import { CloudProvider, CloudService, CloudStack } from '@stackmate/interfaces';
import { parseArrayToUniqueValues } from '@stackmate/lib/parsers';
import {
  CloudPrerequisites, ProviderChoice, RegionList,
  ServiceMapping, ServiceAttributes, CloudAttributes,
} from '@stackmate/types';

abstract class Cloud extends Entity implements CloudProvider {
  /**
 * @var {String} region the provider's region
 */
  @Attribute regions: RegionList;

  /**
   * @var {String} provider the provider's name
   * @abstract
   * @readonly
   */
  abstract readonly provider: ProviderChoice;

  /**
   * @var {Object} availableRegions the regions that the provider can deploy resources in
   * @abstract
   * @readonly
   */
  abstract readonly availableRegions: RegionList;

  /**
   * @var {Object} serviceMapping a key value mapping of {service type => class}
   * @abstract
   * @readonly
   */
  abstract readonly serviceMapping: ServiceMapping;

  /**
   * @returns {CloudPrerequisites} the prerequisites for a service that is deployed in this cloud
   */
  abstract prerequisites(): CloudPrerequisites;

  /**
   * @var {Stack} stack the stack to use
   * @readonly
   */
  stack: CloudStack;

  /**
   * @var {Registry} services the services registry
   */
  readonly services: Registry = new Registry();

  /**
   * @var {Map} aliases the provider aliases to use, per region
   */
  readonly aliases: Map<string, string | undefined> = new Map();

  /**
   * @var {String} defaultRegion the default region to deploy core services to
   */
  protected defaultRegion: string;

  /**
   * @returns {String} the error message
   */
  public get validationMessage(): string {
    return `The configuration for the ${this.provider} cloud provider is invalid`;
  }

  /**
   * @returns {AttributeParsers} the parsers to use for the attributes
   */
  parsers() {
    return {
      regions: parseArrayToUniqueValues,
    };
  }

  /**
   * @returns {Validations} the validations to use in the entity
   */
  validations() {
    return {
      regions: {
        validateRegions: {
          availableRegions: Object.values(this.availableRegions),
        }
      },
    };
  }

  /**
   * Initializes the cloud provider
   *
   * We pick a region as a default, then set up an alias for the rest
   */
  protected initialize() {
    if (isNil(this.regions)) {
      throw new Error('You have to initialize the cloud after you have assigned the attributes');
    }

    const { regions: { defaultRegion = this.defaultRegion, ...regions } } = this.attributes;

    this.aliases.set(this.defaultRegion, undefined);

    regions.forEach((region: string) => {
      this.aliases.set(
        region, snakeCase(`${this.provider}_${region}`),
      );
    });
  }

  /**
   * Introduces a service to the cloud stack
   *
   * @param {ServiceAttributes} attributes the introduced service's attributes
   * @returns {CloudService} the initialized cloud service
   */
  introduce(attributes: Omit<ServiceAttributes, 'provider'>): CloudService {
    const { type, region, ...serviceAttributes } = attributes;

    const ServiceClass = get(this.serviceMapping, type, null);

    if (!ServiceClass) {
      throw new Error(`Service ${type} for ${this.provider} is not supported, yet`);
    }

    const service = ServiceClass.factory(
      this.stack, this.prerequisites(), serviceAttributes, this.aliases.get(region),
    );

    this.services.add(service);

    return service;
  }

  /**
   * Registers the cloud provider into the stack
   */
  provision(): void {
    // Get all the services
    // Provision & link services
  }

  /**
   * Instantiates and validates a cloud provider
   *
   * @param {ServiceAttributes} attributes the service's attributes
   * @param {Object} stack the terraform stack object
   * @param {Object} prerequisites any prerequisites by the cloud provider
   */
  static factory<T extends Cloud>(
    this: new (...args: any[]) => T,
    attributes: CloudAttributes,
    stack: CloudStack,
  ): T {
    const cloud = new this;
    cloud.attributes = attributes;
    cloud.stack = stack;
    cloud.validate();
    cloud.initialize();

    return cloud;
  }
}

export default Cloud;
