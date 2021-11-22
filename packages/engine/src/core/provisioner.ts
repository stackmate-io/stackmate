import { join as joinPaths } from 'path';
import { App as TerraformApp, Manifest, TerraformStack } from 'cdktf';

import Registry from '@stackmate/core/registry';
import CloudManager from '@stackmate/core/manager';
import { NormalizedStages } from '@stackmate/types';
import { Project } from '@stackmate/interfaces';

class Provisioner {
  /**
   * @var {String} stageName the stage's name
   * @readonly
   */
  public readonly stage: string;

  /**
   * @var {App} app the terraform app to synthesize
   * @readonly
   */
  public readonly app: TerraformApp;

  /**
   * @var {TerraformStack} stack the stack to use to provision the services with
   * @readonly
   */
  public readonly stack: TerraformStack;

  /**
   * @var {Registry} _services the services registry
   * @private
   */
  private _services: Registry;

  /**
   * @var {CloudManager} clouds the class that handles the cloud services
   */
  public clouds: CloudManager;

  constructor(project: Project, stage: string) {
    this.stage = stage;

    this.app = new TerraformApp({ outdir: project.outputPath, stackTraces: false });
    this.stack = new TerraformStack(this.app, this.stage);

    const { contents: { defaults: projectDefaults } } = project;
    this.clouds = new CloudManager(this.stack, projectDefaults);
    this.services = project.stage(this.stage);
  }

  /**
   * Populates the services registry
   *
   * @param {Array<object>} services the services attributes
   */
  public set services(services: NormalizedStages) {
    this._services = new Registry();

    Object.keys(services).forEach((name: string) => {
      const { provider, region } = services[name];

      this._services.add(
        this.clouds.get(provider, region).service(services[name]),
      );
    });
  }

  /**
   * @returns {String} the root path for the stacks to be synthesized
   */
  public get rootPath(): string {
    return this.app.outdir;
  }

  /**
   * @returns {String} returns the stack path for the stage
   */
  public get stackPath(): string {
    return joinPaths(
      this.rootPath, Manifest.stacksFolder, this.stage,
    );
  }
}

export default Provisioner;
