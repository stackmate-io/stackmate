import Registry from '@stackmate/core/registry';
import CloudManager from '@stackmate/core/manager';
import Stack from '@stackmate/core/stack';
import { Vault, CloudStack } from '@stackmate/interfaces';
import { NormalizedStages, ProjectDefaults } from '@stackmate/types';

class Stage {
  /**
   * @var {String} name the stage's name
   * @readonly
   */
  public readonly name: string;

  /**
   * @var {Registry} services the services registry
   * @private
   */
  services: Registry;

  /**
   * @var {Stack} stack the stack to use to provision the services with
   * @readonly
   */
  readonly stack: CloudStack;

  /**
   * @var {CloudManager} clouds the class that handles the cloud services
   */
  readonly clouds: CloudManager;

  constructor(name: string, targetPath: string, defaults: ProjectDefaults = {}) {
    this.name = name;
    this.stack = new Stack(this.name, targetPath);
    this.clouds = new CloudManager(this.stack, defaults);
    this.services = new Registry();
  }

  /**
   * Populates the stage's services registry
   *
   * @param {Array<object>} services the services attributes
   * @param {Vault} vault the stage's credentials vault
   */
  public populate(services: NormalizedStages, vault: Vault): Stage {
    Object.keys(services).forEach((name: string) => {
      const { [name]: attributes, [name]: { type, provider, region } } = services;

      const service = this.clouds.get(provider, region).service(type, {
        ...attributes,
        credentials: vault.credentials(this.name),
        rootCredentials: vault.rootCredentials(this.name),
      });

      this.services.add(service);
    });

    return this;
  }
}

export default Stage;
