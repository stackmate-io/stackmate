import Registry from '@stackmate/core/registry';
import { CloudStack } from '@stackmate/interfaces';
import { ProjectDefaults, ServiceConfigurationDeclarationNormalized } from '@stackmate/types';
import CloudManager from '@stackmate/core/manager';
import Stack from '@stackmate/core/stack';

class Provisioner {
  /**
   * @var {CloudStack} stack the stack to use to provision the services with
   */
  public stack: CloudStack;

  /**
   * @var {Registry} _services the services registry
   * @private
   */
  private _services: Registry;

  /**
   * @var {CloudManager} clouds the class that handles the cloud services
   */
  public clouds: CloudManager;

  constructor(stageName: string, services: { [name: string]: ServiceConfigurationDeclarationNormalized } = {}, defaults: ProjectDefaults = {}) {
    this.stack = Stack.factory(stageName);
    this.clouds = new CloudManager(this.stack, defaults);
    this.services = services;
  }

  /**
   * Populates the services registry
   *
   * @param {Array<object>} services the services attributes
   */
  public set services(services: { [name: string]: ServiceConfigurationDeclarationNormalized }) {
    this._services = new Registry();

    Object.keys(services).forEach((name: string) => {
      const { provider, region } = services[name];

      const service = this.clouds.get(provider, region).service(services[name]);

      service.provision();

      this._services.add(service);
    });
  }

  async deploy() {
  }
}

export default Provisioner;
