import { get, isEmpty } from 'lodash';

import { CloudProvider, CloudStack, CloudService } from '@stackmate/interfaces';
import {
  CloudPrerequisites, ProviderChoice, RegionList, ServiceMapping,
  ProviderDefaults, ServiceConfigurationDeclarationNormalized,
} from '@stackmate/types';

abstract class Cloud implements CloudProvider {
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
  protected abstract prerequisites: CloudPrerequisites;

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
   * @var {String} _region the provider's region
   * @private
   */
  private _region: string;

  /**
   * Initializes the provider
   *
   * @abstract
   * @void
   */
  abstract init(): void;

  constructor(stack: CloudStack, defaults: ProviderDefaults = {}) {
    this.stack = stack;
    this.defaults = defaults;
  }

  /**
   * @returns {String} the region for the cloud provider
   */
  public get region(): string {
    return this._region;
  }

  /**
   * @param {String} region the region for the cloud provider
   */
  public set region(region: string) {
    if (!region || !Object.values(this.regions)) {
      throw new Error(`Invalid region ${region} for provider ${this.provider}`);
    }

    this._region = region;
  }

  /**
   * Registers a service in the cloud services registry
   *
   * @param {ServiceAttributes} attributes the service's attributes
   * @returns {CloudService} the service that just got registered
   */
  service(attributes: Omit<ServiceConfigurationDeclarationNormalized, 'provider'>): CloudService {
    const { type } = attributes;

    const ServiceClass = get(this.serviceMapping, type, null);

    if (!ServiceClass) {
      throw new Error(`Service ${type} for ${this.provider} is not supported, yet`);
    }

    const service = new ServiceClass(this.stack);
    service.attributes = attributes;

    if (!isEmpty(this.prerequisites)) {
      service.dependencies = this.prerequisites;
    }
    service.provision();

    return service;
  }
}

export default Cloud;
