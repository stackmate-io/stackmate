import { CloudManager, CloudStack, CloudService } from '@stackmate/interfaces';
import { CloudPrerequisites, ProviderChoice, RegionList, ServiceDeclaration, ServiceMapping } from '@stackmate/types';

abstract class Cloud implements CloudManager {
  abstract readonly provider: ProviderChoice;

  abstract readonly regions: RegionList;

  abstract readonly serviceMapping: ServiceMapping;

  protected abstract prerequisites: CloudPrerequisites;

  readonly stack: CloudStack;

  readonly defaults: object; // todo

  /**
   * @var {String} _region the provider's region
   * @private
   */
  private _region: string;

  abstract init(): void;

  constructor(region: string, stack: CloudStack, defaults = {}) { // todo: defaults
    this.stack = stack;
    this.defaults = defaults;
    this.region = region;
    this.init();
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
   * @param {ServiceTypeChoice} type the type of the service to register
   * @param {ServiceAttributes} attributes the service's attributes
   * @returns {CloudService} the service that just got registered
   */
  service(attributes: ServiceDeclaration): CloudService {
    const { type, ...attrs } = attributes;
    const ServiceClass = this.serviceMapping.get(type);
    if (!ServiceClass) {
      throw new Error(`Service ${type} for ${this.provider} is not supported, yet`);
    }

    const service = new ServiceClass(this.stack, attrs);
    service.dependencies = this.prerequisites;
    service.validate();

    return service;
  }
}

export default Cloud;
