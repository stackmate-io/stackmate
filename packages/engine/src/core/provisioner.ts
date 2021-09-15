import Stack from '@stackmate/core/stack';
import Cloud from '@stackmate/core/cloud';
import Registry from '@stackmate/core/registry';
import { CloudManager, CloudStack } from '@stackmate/interfaces';
import { ProviderChoice, ProjectDefaults, ServiceAttributes } from '@stackmate/types';

class Provisioner {
  /**
   * @var {String} name the name for the stage
   */
  public stage: string;

  /**
   * @var {CloudStack} stack the stack to use to provision the services with
   */
  public stack: CloudStack;

  /**
   * @var {Map} _clouds a collection of the cloud managers that have been instantiated for the stage
   * @private
   */
  private _clouds: Map<string, CloudManager> = new Map();

  /**
   * @var {Registry} _services the services registry
   * @private
   */
  private _services: Registry;

  /**
   * @var {Object} defaults the defaults to apply to the provisioning
   * @readonly
   */
  readonly defaults: ProjectDefaults;

  constructor(stage: string, services: { [name: string]: ServiceAttributes } = {}, defaults: ProjectDefaults = {}) {
    this.stage = stage;
    this.stack = Stack.factory(stage);
    this.services = services;
    this.defaults = defaults;
  }

  /**
   * Returns a cloud manager based on a provider name and region
   *
   * @param {ProviderChoice} provider string the provider for the cloud manager
   * @param {String} region string the cloud region to use
   * @returns {CloudManager} the cloud manager for the specified provider & region
   */
  getCloud(provider: ProviderChoice, region: string): CloudManager {
    const key = `${provider}-${region}`;
    if (this._clouds.has(key)) {
      return this._clouds.get(key)!;
    }

    const cloud = Cloud.factory(provider, region, this.stack, this.defaults[provider] || {});
    this._clouds.set(key, cloud);
    return cloud;
  }

  /**
   * Populates the services registry
   *
   * @param {Array<object>} services the services attributes
   */
  public set services(services: { [name: string]: ServiceAttributes }) {
    this._services = new Registry();
    Object.keys(services).forEach((name: string) => {
      const attributes = services[name];
      const { provider, region } = attributes;

      const service = this.getCloud(provider, region).service(attributes);
      service.provision();

      this._services.add(service);
    });
  }

  async deploy() {
  }
}

export default Provisioner;
