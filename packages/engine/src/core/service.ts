import validate from 'validate.js';
import { difference, fromPairs, get, has, isArray, isEmpty, isString, toPairs } from 'lodash';

import { CloudStack, CloudService, Validatable, AttributeAssignable } from '@stackmate/interfaces';
import { ValidationError } from '@stackmate/core/errors';
import { SERVICE_TYPE } from '@stackmate/core/constants';
import { parseArrayToUniqueValues, parseString } from '@stackmate/core/utils';
import {
  Validations, RegionList, ServiceAttributes, ServiceAssociation,
  ProviderChoice, CloudPrerequisites, ServiceTypeChoice, AttributeNames,
} from '@stackmate/types';

abstract class Service implements CloudService, Validatable, AttributeAssignable {
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
   * @var {CloudStack} stack the stack that the service is provisioned against
   * @protected
   * @readonly
   */
  protected readonly stack: CloudStack;

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
   * Provisions the service's resources
   * @abstract
   */
  abstract provision(): void;

  constructor(stack: CloudStack) {
    this.stack = stack;
  }

  /**
   * Returns a key => function. THe key describes an acceptable attribute name
   * and the function is the parser which would return a valid value
   *
   * @returns {Objct} the attribute names and their parsers
   */
  attributeNames(): AttributeNames {
    return {
      name: parseString,
      type: parseString,
      region: parseString,
      provider: parseString,
      links: parseArrayToUniqueValues,
    };
  }

  /**
   * Sets the attributes for the service
   *
   * @param {Object} attributes the attributes to set to the service
   */
  public set attributes(attributes: ServiceAttributes) {
    const acceptedAttributes = this.attributeNames();

    // Validate the keys provided first
    const invalidKeys = difference(Object.keys(attributes), Object.keys(acceptedAttributes));
    if (!isEmpty(invalidKeys)) {
      throw new Error(
        `The ${this.type} service contains invalid attributes: ${invalidKeys.join(', ')}`,
      );
    }

    // Parse & finalize the attributes
    const parsedAttributes = fromPairs(
      toPairs(acceptedAttributes).map(
        ([attributeName, parserFunction]) => {
          // Where to get the attribute value from:
          //  in case it's declared in the `attributes` object, use that
          //  otherwise, use the default value that is set on this object
          const attributeSource = has(attributes, attributeName) ? attributes : this;
          return [attributeName, parserFunction.call(this, get(attributeSource, attributeName))];
        },
      ),
    );

    // Validate the attributes
    this.validate(parsedAttributes as ServiceAttributes);

    // Validation passed, we can now assign the attributes to the project
    toPairs(parsedAttributes).forEach(([attributeName, attributeValue]) => {
      (this as any)[attributeName] = attributeValue;
    });
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
   * Validates a service's attributes
   *
   * @param {Object} attributes the service attributes to validated
   * @throws {ValidationError} when the attributes are invalid
   * @void
   */
  validate(attributes: ServiceAttributes): void {
    const errors = validate.validate(attributes, this.validations(), {
      fullMessages: false,
    });

    if (!isEmpty(errors)) {
      const { name } = attributes;
      console.log(attributes, errors);
      throw new ValidationError(
        `The configuration for ${name || 'the'} service is invalid`, errors,
      );
    }
  }

  /**
   * Returns the validations for the service
   *
   * @returns {Object} the validations to use
   */
  validations(): Validations {
    validate.validators.validateLinks = (links: Array<string>) => {
      if (isArray(links) && !links.every(l => isString(l))) {
        return 'The service contains an invalid entries under “links“';
      }
    };

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
      type: {
        presence: {
          allowEmpty: false,
          message: 'A type should be provided',
        },
        inclusion: {
          within: Object.values(SERVICE_TYPE),
          message: `The service type is invalid. Available options are ${Object.values(SERVICE_TYPE).join(', ')}`,
        },
      },
      links: {
        validateLinks: true,
      },
    };
  }
}

export default Service;
