import Stack from 'core/stack';
import { ICloudManager, IStack } from 'interfaces';
import { ServiceDeclaration, ProviderChoice } from 'types';
import { getCloudManager } from 'clouds';

class Stage {
  public name: string;

  public stack: IStack;

  private _clouds: Map<string, ICloudManager> = new Map();

  constructor(name: string, services: Array<ServiceDeclaration>) { // cleanup
    this.name = name;
    this.stack = Stack.factory(name);
    this.processServices(services);
  }

  getCloud(provider: ProviderChoice, region: string): ICloudManager {
    const key = `${provider}-${region}`;

    if (!this._clouds.has(key)) {
      this._clouds.set(key, getCloudManager(provider, region, this.stack));
    }

    return this._clouds.get(key)!;
  }

  protected processServices(serviceAttributes: Array<ServiceDeclaration> = []) {
    serviceAttributes.forEach((attrs: ServiceDeclaration) => {
      const { provider, region, name, type, ...attributes } = attrs;

      this.getCloud(provider, region).register(type, name, attributes);
    });
  }

  protected prepare() {
    this._clouds.forEach((cloud) => cloud.prepare());
  }

  async deploy() {
    this.prepare();
  }

  async destroy() {
    this.prepare();
  }

  async state() {
    this.prepare();
  }
}

export default Stage;
