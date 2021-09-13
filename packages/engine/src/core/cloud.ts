import { CloudManager, CloudStack, CloudService } from '@stackmate/interfaces';
import { CloudPrerequisites, ProviderChoice, RegionList, ServiceDeclaration, ServiceMapping, ProviderDefaults, AwsDefaults } from '@stackmate/types';
import { AwsCloud } from '@stackmate/clouds/aws';
import { PROVIDER } from '@stackmate/core/constants';

abstract class Cloud implements CloudManager {
  abstract readonly provider: ProviderChoice;

  abstract readonly regions: RegionList;

  abstract readonly serviceMapping: ServiceMapping;

  protected abstract prerequisites: CloudPrerequisites;

  readonly stack: CloudStack;

  readonly defaults: ProviderDefaults;

  /**
   * @var {String} _region the provider's region
   * @private
   */
  private _region: string;

  abstract init(): void;

  constructor(region: string, stack: CloudStack, defaults: ProviderDefaults = {}) { // todo: defaults
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

    return service;
  }

  /**
   * Returns a cloud manager based on the provider and region
   *
   * @param {String} provider the provider to instantiate
   * @param {String} region the region for the provider
   * @param {Stack} stack the stack to provision
   * @param {Object} defaults any defaults to apply
   * @returns {Cloud} the cloud provider
   */
  static factory(provider: ProviderChoice, region: string, stack: CloudStack, defaults: ProviderDefaults): Cloud {
    if (provider === PROVIDER.AWS) {
      return new AwsCloud(region, stack, defaults as AwsDefaults);
    }

    throw new Error(`Provider ${provider} is not supported, yet`);
  }
}

export default Cloud;
