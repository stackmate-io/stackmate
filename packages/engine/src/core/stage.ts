import { join as joinPaths } from 'path';
import { App as TerraformApp, Manifest, TerraformStack } from 'cdktf';

import Registry from '@stackmate/core/registry';
import CloudManager from '@stackmate/core/manager';
import { Vault } from '@stackmate/interfaces';
import { NormalizedStages, ProjectDefaults } from '@stackmate/types';

class Stage {
  /**
   * @var {String} name the stage's name
   * @readonly
   */
  public readonly name: string;

  /**
   * @var {App} app the terraform app to synthesize
   * @readonly
   */
  public readonly app: TerraformApp;

  /**
   * @var {TerraformStack} stack the stack to use to provision the services with
   * @readonly
   */
  protected readonly stack: TerraformStack;

  /**
   * @var {CloudManager} clouds the class that handles the cloud services
   */
  protected readonly clouds: CloudManager;

  /**
   * @var {Registry} _services the services registry
   * @private
   */
  private _services: Registry;

  constructor(name: string, targetPath: string, defaults: ProjectDefaults = {}) {
    this.name = name;
    this.app = new TerraformApp({ outdir: targetPath, stackTraces: false });
    this.stack = new TerraformStack(this.app, this.name);
    this.clouds = new CloudManager(this.stack, defaults);
    this._services = new Registry();
  }

  /**
   * @returns {String} the root path for the stacks to be synthesized
   */
  public get targetPath(): string {
    return this.app.outdir;
  }

  /**
   * @returns {String} returns the stack path for the stage
   */
  public get stackPath(): string {
    return joinPaths(
      this.targetPath, Manifest.stacksFolder, this.name,
    );
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

      const service = this.clouds.get(provider, region).service(type);

      // Enhance the attributes with any credentials that might be related and populate the service
      service.populate({
        ...attributes,
        credentials: vault.credentials(this.name),
        rootCredentials: vault.rootCredentials(this.name),
      });

      this._services.add(service);
    });

    return this;
  }

  /**
   * Synthesizes the application's stack and writes out the corresponding TF files
   * @void
   */
  synthesize(): void {
    this.app.synth();
  }
}

export default Stage;
