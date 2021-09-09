import { CloudManager, CloudStack, CloudService } from 'interfaces';
import { CloudPrerequisites, ConstructorOf, ProviderChoice, RegionList, ServiceAttributes, ServiceList, ServiceMapping, ServiceTypeChoice } from 'types';

abstract class Cloud implements CloudManager {
  abstract readonly provider: ProviderChoice;

  abstract readonly regions: RegionList;

  abstract readonly serviceMapping: ServiceMapping;

  protected abstract prerequisites: CloudPrerequisites;

  readonly stack: CloudStack;

  readonly region: string;

  readonly defaults: object; // todo

  /**
   * @var {Map} _services the services registry
   */
  private _services: ServiceList = new Map();

  abstract init(): void;

  constructor(region: string, stack: CloudStack, defaults = {}) { // todo: defaults
    this.region = region;
    this.defaults = defaults;
    this.stack = stack;
    this.init();
  }

  /**
   * Returns the service class given a specific type
   *
   * @param {String} type the type of service class to provide
   * @returns {CloudService} the class for the service to instantiate
   */
  protected getServiceClass(type: ServiceTypeChoice): ConstructorOf<CloudService> {
    if (!type) {
      throw new Error('Invalid type specified');
    }

    const serviceClass = this.serviceMapping.get(type);

    if (!serviceClass) {
      throw new Error(`Service ${type} for ${this.provider} is not supported, yet`);
    }

    return serviceClass;
  }

  /**
   * Registers a service in the cloud services registry
   *
   * @param {ServiceTypeChoice} type the type of the service to register
   * @param {String} name the name of the service to register
   * @param {ServiceAttributes} attrs the service's attributes
   * @returns {CloudService} the service that just got registered
   */
  register(type: ServiceTypeChoice, name: string, attrs: ServiceAttributes): CloudService {
    const ServiceClass = this.getServiceClass(type);

    const service = new ServiceClass(name, attrs, this.stack, this.prerequisites);

    this._services.set(service.name, service);

    return service;
  }

  /**
   * Prepares the cloud provider for an operation
   */
  prepare() {
    // Main service provisions
    this._services.forEach(service => service.provision());

    // Process the services associations, after all service provisions are in place
    this._services.forEach(service => service.link(this._services));
  }
}

export default Cloud;
