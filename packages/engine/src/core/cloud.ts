import { get, isEmpty } from 'lodash';

import { CloudProvider, CloudService, CloudStack, Provisionable } from '@stackmate/interfaces';
import {
  CloudPrerequisites, ProviderChoice, RegionList, ServiceMapping,
  ProviderDefaults, ServiceTypeChoice,
} from '@stackmate/types';

abstract class Cloud implements CloudProvider, Provisionable {
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
   * @var {Object} prerequisites a key value mapping of {string => Service} of the main provisions
   * @abstract
   * @protected
   */
  protected abstract get prerequisites(): CloudPrerequisites;

  /**
   * @var {Stack} stack the stack to use for provisioning
   * @readonly
   */
  readonly stack: CloudStack;

  /**
   * @var {Object} defaults any provider defaults to be used in the resources
   * @readonly
   */
  readonly defaults: ProviderDefaults;

  /**
   * @var {String} region the provider's region
   * @readonly
   */
  public readonly region: string;

  /**
   * Initializes the provider
   *
   * @abstract
   * @void
   */
  abstract init(): void;

  constructor(stack: CloudStack, region: string, defaults: ProviderDefaults = {}) {
    this.stack = stack;
    this.defaults = defaults;
  }

  /**
   * Provisions the cloud's prerequisites
   */
  provision() {
    if (!this.prerequisites || isEmpty(this.prerequisites)) {
      return;
    }

    Object.keys(this.prerequisites).forEach((key) => this.prerequisites[key].provision());
  }

  /**
   * Registers a service in the cloud services registry
   *
   * @param {ServiceAttributes} attributes the service's attributes
   * @returns {CloudService} the service that just got registered
   */
  service(type: ServiceTypeChoice): CloudService {
    const ServiceClass = get(this.serviceMapping, type, null);

    if (!ServiceClass) {
      throw new Error(`Service ${type} for ${this.provider} is not supported, yet`);
    }

    return new ServiceClass(this.stack, this.prerequisites);
  }

  /**
   * Provisions the cloud's prerequisites
   */
  provision() {
    if (!this.prerequisites || isEmpty(this.prerequisites)) {
      return;
    }

    Object.keys(this.prerequisites).forEach((key) => this.prerequisites[key].provision());
  }
}

export default Cloud;
