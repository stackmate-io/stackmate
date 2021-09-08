import { CloudManager, EnvironmentStack, CloudService } from 'interfaces';
import { ConstructorOf, ProviderChoice, RegionList, ServiceAttributes, ServiceList, ServiceMapping, ServiceTypeChoice } from 'types';

abstract class Cloud implements CloudManager {
  abstract readonly provider: ProviderChoice;

  abstract readonly regions: RegionList;

  abstract readonly serviceMapping: ServiceMapping;

  protected abstract prerequisites: Array<CloudService>;

  readonly stack: EnvironmentStack;

  readonly region: string;

  readonly defaults: object; // todo

  private _services: ServiceList = new Map();

  abstract init(): void;

  constructor(region: string, stack: EnvironmentStack, defaults = {}) { // todo: defaults
    this.region = region;
    this.defaults = {};
    this.stack = stack;
    this.init();
  }

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

  register(type: ServiceTypeChoice, name: string, attrs: ServiceAttributes): CloudService {
    const ServiceClass = this.getServiceClass(type);

    const service = new ServiceClass(name, attrs, this.stack);

    service.associate(this.prerequisites);

    this._services.set(service.name, service);

    return service;
  }

  prepare() {
    // Main service provisions
    this._services.forEach(
      service => service.provision(),
    );

    // Process the services associations, after all service provisions are in place
    this._services.forEach((service) => {
      const associated = service.associations.map((name) => {
        const association = this._services.get(name);

        if (!association) {
          throw new Error(`Associated service ${name} was not found in the stack`);
        }

        return association;
      });

      if (associated) {
        service.associate(associated);
      }
    });
  }
}

export default Cloud;
