import { join } from 'path';
import { App as TerraformApp, Manifest, TerraformStack } from 'cdktf';

import Registry from '@stackmate/core/registry';
import { NormalizedStages } from '@stackmate/types';
import CloudManager from '@stackmate/core/manager';
import Project from '@stackmate/core/project';
import { STORAGE } from '@stackmate/core/constants';

class Provisioner {
  /**
   * @var {String} stageName the stage's name
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

  constructor(project: Project, name: string) {
    this.name = name;
    this.app = new TerraformApp({ outdir: project.outputPath, stackTraces: false });
    this.stack = new TerraformStack(this.app, this.name);
    this.clouds = new CloudManager(this.stack, project.defaults);
    this.services = project.stage(this.name);
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
    return join(
      this.rootPath, Manifest.stacksFolder, this.name,
    );
  }

  /**
   * Loads and synthesizes a stack given a project file and a stage
   *
   * @param {String} projectFile the project file to load
   * @param {String} stage the stage to synthesize
   * @returns {Provisioner} the provisioner instance
   */
  static async synth(projectFile: string, stage: string): Promise<Provisioner> {
    const project = new Project(projectFile, STORAGE.FILE);
    await project.load();

    const provisioner = new Provisioner(project, stage);
    provisioner.app.synth();

    return provisioner;
  }
}

export default Provisioner;
