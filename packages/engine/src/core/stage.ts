import Stack from 'core/stack';
import { CloudManager, CloudStack } from 'interfaces';
import { ServiceDeclaration, ProviderChoice } from 'types';
import { getCloudManager } from 'clouds';

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

  constructor(name: string, services: Array<ServiceDeclaration>) { // cleanup
    this.name = name;
    this.stack = Stack.factory(name);
    this.processServices(services);
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

  protected processServices(serviceAttributes: Array<ServiceDeclaration> = []) {
    serviceAttributes.forEach((attributes: ServiceDeclaration) => {
      const { provider, region, name, type, ...rest } = attributes;
      this.getCloud(provider, region).register(type, { name, region, ...rest });
    });
  }

  protected prepare() {
    this._clouds.forEach(cloud => cloud.prepare());
  }

  /**
   * Deploys the stage
   */
  async deploy() {
    this.prepare();
  }

  /**
   * Destroys the stage
   */
  async destroy() {
    this.prepare();
  }

  /**
   * Returns the state of the resources for the stage
   */
  async state() {
    this.prepare();
  }
}

export default Stage;
