import { get } from 'lodash';
import { TerraformProvider } from 'cdktf';

import Entity from '@stackmate/lib/entity';
import { Attribute } from '@stackmate/lib/decorators';
import { CloudProvider, CloudService, CloudStack } from '@stackmate/interfaces';
import { parseString } from '@stackmate/lib/parsers';
import {
  CloudPrerequisites, ProviderChoice, RegionList, ServiceMapping,
  ServiceTypeChoice, ServiceAttributes, CloudAttributes,
} from '@stackmate/types';

abstract class Cloud extends Entity implements CloudProvider {
  /**
   * @var {String} provider the provider's name
   * @abstract
   * @readonly
   */
  abstract readonly provider: ProviderChoice;

  /**
   * @var {Object} regions the regions that the provider can provision resources in
   * @abstract
   * @readonly
   */
  abstract readonly regions: RegionList;

  /**
   * @var {Object} serviceMapping a key value mapping of {service type => class}
   * @abstract
   * @readonly
   */
  abstract readonly serviceMapping: ServiceMapping;

  /**
   * @returns {CloudPrerequisites} the prerequisites for a service that is provisioned in this cloud
   */
  abstract prerequisites(): CloudPrerequisites;

  /**
   * Provisions the cloud into the stack
   */
  abstract provision(): void;

  /**
   * @var {String} region the provider's region
   */
  @Attribute region: string;

  /**
   * @var {Stack} stack the stack to use for provisioning
   * @readonly
   */
  stack: CloudStack;

  /**
   * @var {TerraformProvider} providerInstance the terraform provider instance
   */
  protected providerInstance: TerraformProvider;

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
      region: parseString,
    };
  }

  /**
   * @returns {Validations} the validations to use in the entity
   */
  validations() {
    return {
      region: {
        presence: {
          allowEmpty: false,
          message: 'You have to provide a region',
        },
        inclusion: {
          within: Object.values(this.regions),
          message: `The region for the ${this.provider} is invalid. Available options are: ${Object.values(this.regions).join(', ')}`,
        },
      },
    };
  }

  /**
   * Registers a service in the cloud services registry
   *
   * @param {ServiceTypeChoice} type the type of service to instantiate
   * @param {ServiceAttributes} attributes the service's attributes
   * @returns {CloudService} the service that just got registered
   */
  service(type: ServiceTypeChoice, attributes: ServiceAttributes): CloudService {
    const ServiceClass = get(this.serviceMapping, type, null);

    if (!ServiceClass) {
      throw new Error(`Service ${type} for ${this.provider} is not supported, yet`);
    }

    return ServiceClass.factory(attributes, this.stack, this.prerequisites());
  }

  /**
   * Instantiates, validates and provisions a cloud provider
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

    return cloud;
  }
}

export default Cloud;
