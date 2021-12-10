import { isEmpty, toPairs } from 'lodash';

import Entity from '@stackmate/lib/entity';
import { CloudStack, Provisionable } from '@stackmate/interfaces';
import { CloudService, AttributesParseable } from '@stackmate/interfaces';
import { parseArrayToUniqueValues, parseString } from '@stackmate/lib/parsers';
import {
  Validations, RegionList, ServiceAttributes, ServiceAssociation,
  ProviderChoice, CloudPrerequisites, ServiceTypeChoice,
} from '@stackmate/types';

abstract class Service extends Entity implements CloudService, AttributesParseable, Provisionable {
  /**
   * @var {String} name the service's name
   */
  public name: string;

  /**
   * @var {String} region the region the service operates in
   */
  public region: string;

  /**
   * @var {ServiceAssociationDeclarations} links the list of service names that the current service
   *                                             is associated (linked) with
   */
  public links: Array<string> = [];

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
   *  return [{
   *    lookup: AwsVpcService,
   *    handler: (vpc): void => this.handleVpcAssociated(vpc as AwsVpcService),
   *  }];
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
   * @param {String} name the service's name
   * @param {Object} stack the terraform stack object
   * @param {Object} prerequisites any prerequisites by the cloud provider
   */
  constructor(stack: CloudStack, prerequisites: CloudPrerequisites = {}) {
    super();

    this.stack = stack;

    if (!isEmpty(prerequisites)) {
      this.dependencies = prerequisites;
    }
  }

  /**
   * @param {Object} attributes the attributes to parse
   * @returns {ServiceAttributes} the parsed attributes
   */
  parseAttributes(attributes: ServiceAttributes): ServiceAttributes {
    const { name, region, links } = attributes;

    return {
      name: parseString(name),
      region: parseString(region),
      links: parseArrayToUniqueValues(links || []),
    };
  }

  /**
   * Populates a service
   *
   * @param {Object} attributes the attributes to populate the service with
   * @returns {Service} the service returned
   */
  populate(attributes: ServiceAttributes): CloudService {
    const parsedAttributes = this.parseAttributes(attributes);

    // Validate the attributes
    this.validate(parsedAttributes);

    // Validation passed, we can now assign the attributes to the project
    toPairs(parsedAttributes).forEach(([attributeName, attributeValue]) => {
      (this as any)[attributeName] = attributeValue;
    });

    this.provision();

    return this;
  }

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
   * Associates the current service with the ones mentioned in the `links` section
   *
   * @param {Service} target the service to link the current service with
   */
  public link(target: Service) {
    // Find an appropriate handler & run it
    const { handler } = this.associations.find(({ lookup }) => target instanceof lookup) || {};

    if (handler) {
      handler.call(this, target);
    }
  }

  /**
   * @param {ServiceAttributes} attributes the service's attributes
   * @returns {String} the message to display
   */
  public getValidationError(attributes: ServiceAttributes): string {
    const { name } = attributes;
    return `Invalid configuration for the ${name ? `“${name}”` : ''} ${this.type} service`;
  }

  /**
   * Returns the validations for the service
   *
   * @returns {Object} the validations to use
   */
  validations(): Validations {
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
          within: Object.values(this.regions),
          message: `The region for this service is invalid. Available options are: ${Object.values(this.regions).join(', ')}`,
        },
      },
      links: {
        validateServiceLinks: true,
      },
    };
  }
}

export default Service;
