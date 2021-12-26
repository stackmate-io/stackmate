import { TerraformProvider } from 'cdktf';
import { get, isEmpty } from 'lodash';

import Entity from '@stackmate/lib/entity';
import { Attribute } from '@stackmate/lib/decorators';
import { CloudProvider, CloudService, CloudStack } from '@stackmate/interfaces';
import { parseString } from '@stackmate/lib/parsers';
import {
  CloudPrerequisites, ProviderChoice, RegionList, ServiceMapping,
  ServiceTypeChoice, EntityAttributes, ServiceAttributes,
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
   * Provisions the cloud and its prerequisites
   * @void
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
  readonly stack: CloudStack;

  /**
   * @var {TerraformProvider} providerInstance the terraform provider instance
   */
  protected providerInstance: TerraformProvider;

  /**
   * @var {Object} prerequisites a key value mapping of {string => Service} of the main provisions
   * @private
   */
  private provisions: CloudPrerequisites = {};

  /**
   * @constructor
   * @param {CloudStack} stack the cloud stack to use for provisioning
   * @param {String} region the region for the cloud provider
   * @param {Object} defaults the defaults for the cloud
   */
  constructor(attributes: EntityAttributes, stack: CloudStack) {
    super(attributes);

    this.stack = stack;
  }

  /**
   * @returns {String} the error message
   */
  public get validationMessage(): string {
    return `The configuration for the ${this.provider} cloud provider is invalid`;
  }

  /**
   * @returns {CloudPrerequisites} the cloud provider's prerequisites
   */
  protected get prerequisites(): CloudPrerequisites {
    return this.provisions;
  }

  /**
   * @param {CloudPrerequisites} prereqs the prerequisites the cloud provider provides
   */
  protected set prerequisites(prereqs: CloudPrerequisites) {
    Object.values(prereqs).forEach((service) => {
      if (!service.isProvisioned) {
        service.provision();
      }
    });

    this.provisions = prereqs;
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
   * @returns {Boolean} whether the cloud provider is provisioned
   */
  public get isProvisioned(): boolean {
    return this.providerInstance instanceof TerraformProvider
      && !isEmpty(this.prerequisites)
      && Object.values(this.prerequisites).every((srv) => srv.isProvisioned);
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

    const service = new ServiceClass(attributes, this.stack, this.prerequisites);
    service.validate();
    service.provision();

    return service;
  }
}

export default Cloud;
