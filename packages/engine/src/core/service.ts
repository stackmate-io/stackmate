import { CloudStack, CloudService } from 'interfaces';
import {
  ServiceAttributes, ServiceAssociation, ServiceTypeChoice,
  ProviderChoice, ServiceAssociationDeclarations, CloudPrerequisites, ServiceList,
} from 'types';

abstract class Service implements CloudService {
  /**
   * @var {String} name the service's name
   */
  public name: string;

  /**
   * @var {ServiceAssociationDeclarations} links the list of service names that the current service
   *                                             is associated (linked) with
   */
  public links: ServiceAssociationDeclarations = [];

  /**
   * @var {ServiceAttributes} attributes the service's attributes
   */
  public attributes: ServiceAttributes;

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

  constructor(name: string, attributes: ServiceAttributes, stack: CloudStack, dependencies: CloudPrerequisites) {
    this.name = name;
    this.attributes = attributes;
    this.stack = stack;
    this.dependencies = dependencies;
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

  public link(services: ServiceList) {
    this.links.forEach((name) => {
      // Get the service mentioned in the `links` section of the attributes
      const target = services.get(name);

      if (!target) {
        throw new Error(`Service named ${name} was not found`);
      }

      // Find an appropriate handler & run it
      const { handler } = this.associations.find(({ lookup }) => target instanceof lookup) || {};

      if (handler) {
        handler.call(this, target);
      }
    });
  }

  validate(): void {
  }
}

export default Service;
