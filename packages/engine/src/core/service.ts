import { isEmpty, toPairs } from 'lodash';
import { CloudStack, CloudService } from 'interfaces';
import {
  ServiceAttributes, ServiceAssociation, ServiceTypeChoice, ServiceList,
  ProviderChoice, ServiceAssociationDeclarations, CloudPrerequisites, RegionList,
} from 'types';

abstract class Service implements CloudService {
  /**
   * @var {String} name the service's name
   */
  public name: string;

  /**
   * @var {String} region the region the service operates in
   */
  private _region: string;

  /**
   * @var {ServiceAssociationDeclarations} links the list of service names that the current service
   *                                             is associated (linked) with
   */
  public links: ServiceAssociationDeclarations = [];

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
   * Sets the attributes for the service
   *
   * @param {Object} attributes the attributes to set to the service
   */
  public set attributes(attributes: ServiceAttributes) {
    toPairs(attributes).filter(
      ([key]) => this.hasOwnProperty(key),
    ).forEach(
      ([key, value]) => ((<any>this)[key] = value),
    );
  }

  /**
   * @returns {String} the cloud region that the service operates in
   */
  public get region(): string {
    return this._region;
  }

  /**
   * @param {String} region the region for the service
   */
  public set region(region: string) {
    if (region && !isEmpty(this.regions) && !Object.values(this.regions).includes(region)) {
      throw new Error(`Region ${region} is not supported `);
    }

    this._region = region;
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
   * @param {Map} services the service registry to look up for associations
   */
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
