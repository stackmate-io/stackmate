import { get, isEmpty, isUndefined } from 'lodash';

import Entity from '@stackmate/lib/entity';
import { CloudProvider, CloudService, CloudStack, Provisionable, Validatable } from '@stackmate/interfaces';
import {
  CloudPrerequisites, ProviderChoice, RegionList, ServiceMapping,
  ProviderDefaults, ServiceTypeChoice, Validations,
} from '@stackmate/types';

abstract class Cloud extends Entity implements CloudProvider, Provisionable, Validatable {
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

  /**
   * @constructor
   * @param {CloudStack} stack the cloud stack to use for provisioning
   * @param {String} region the region for the cloud provider
   * @param {Object} defaults the defaults for the cloud
   */
  constructor(stack: CloudStack, region: string, defaults: ProviderDefaults = {}) {
    super();

    this.stack = stack;

    this.validate({ region: this.region });

    this.defaults = defaults;
    this.region = region;

    this.init();
  }

  /**
   * Get the validation error message to display when the entity isn't valid
   *
   * @param {Object} attributes the entity's attributes
   * @returns {String} the error message
   */
  public getValidationError(attributes: object): string {
    return `The configuration for the ${this.provider} cloud provider is invalid`;
  }

  /**
   * @returns {Validations} the validations to use in the entity
   */
  public validations(): Validations {
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
   * Provisions the cloud's prerequisites
   */
  provision() {
    if (!this.prerequisites || isEmpty(this.prerequisites)) {
      return;
    }

    Object.keys(this.prerequisites).forEach((key) => this.prerequisites[key].provision());
  }

  /**
   * @returns {Boolean} whether the cloud provider is provisioned
   */
  public get isProvisioned(): boolean {
    return !isUndefined(this.prerequisites);
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
}

export default Cloud;
