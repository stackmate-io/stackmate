import Stack from '@stackmate/core/stack';
import { CloudManager, CloudStack } from '@stackmate/interfaces';
import { ServiceDeclaration, ProviderChoice } from '@stackmate/types';
import { getCloudManager } from '@stackmate/clouds';

class Stage {
  /**
   * @var {String} name the name for the stage
   */
  public name: string;

  /**
   * @var {CloudStack} stack the stack to use to provision the services with
   */
  public stack: CloudStack;

  /**
   * @var {Map} _clouds a collection of the cloud managers that have been instantiated for the stage
   * @private
   */
  private _clouds: Map<string, CloudManager> = new Map();

  constructor(name: string) {
    this.name = name;
    this.stack = Stack.factory(name);
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

    if (!this._clouds.has(key)) {
      this._clouds.set(key, getCloudManager(provider, region, this.stack));
    }

    return this._clouds.get(key)!;
  }

  public addService(attributes: ServiceDeclaration) {
    const { provider, region, name, type, ...rest } = attributes;

    this.getCloud(provider, region).register(type, { name, region, ...rest });
  }

  /*
  protected processServices(serviceAttributes: Array<ServiceDeclaration> = []) {
    serviceAttributes.forEach((attributes: ServiceDeclaration) => {
    });
  }
  */

  public prepare() {
    this._clouds.forEach(cloud => cloud.prepare());
  }
}

export default Stage;
