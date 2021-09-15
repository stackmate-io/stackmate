import Provisioner from '@stackmate/core/provisioner';
import Configuration from '@stackmate/core/configuration';

class Project {
  /**
   * @var {Configuration} configuration the project's configuration
   * @readonly
   */
  readonly configuration: Configuration;

  /**
   * @var {Provisioner} _provisioner the project's provisioner
   */
  private _provisioner: Provisioner;

  constructor(configuration: Configuration) {
    this.configuration = configuration;
  }

  /**
   * Deploys a stage to the cloud
   *
   * @param {String} stageName the stage to deploy
   * @async
   */
  async deploy(stageName: string) {
    await this.use(stageName).deploy();
  }

  /**
   * Populates the services in the provisioner
   *
   * @param {String} stageName The stage to provision
   * @returns {Provisioner} the provisioner, having the services populated
   */
  protected use(stageName: string): Provisioner {
    if (!this.configuration.stages[stageName]) {
      throw new Error(
        `Stage ${stageName} was not found in the project. Available options are ${Object.keys(this.configuration.stages)}`,
      );
    }

    this._provisioner = new Provisioner(
      stageName, this.configuration.stages[stageName], this.configuration.defaults,
    );

    return this._provisioner;
  }

  /**
   * Loads a project from a given configuration file path
   *
   * @param {String} path the path for the configuration file to load
   * @returns {Project} the project object
   * @async
   */
  static async load(path: string) {
    const config = await Configuration.load(path);
    const project = new Project(config);
    return project;
  }
}

/*
Usage:
await Project.load(cfg, state).deploy('production');
*/

export default Project;
