import Stage from '@stackmate/core/stage';
import Configuration from '@stackmate/core/configuration';

class Project {
  /**
   * @var {Configuration} configuration the project's configuration
   * @readonly
   */
  readonly configuration: Configuration;

  /**
   * @var {Stage} stage the active project stage
   */
  private _stage: Stage;

  constructor(configuration: Configuration) {
    this.configuration = configuration;
  }

  stage(name: string): Stage {
    if (!this.configuration.stages[name]) {
      throw new Error(`Stage ${name} was not found in the project. Available options are ${Object.keys(this.configuration.stages)}`);
    }

    this._stage = new Stage(name, this.configuration.defaults);
    this._stage.services = this.configuration.stages[name];
    return this._stage;
  }

  static async load(path: string) {
    const config = await Configuration.load(path);
    const project = new Project(config);
    return project;
  }
}

/*
Usage:
await Project.load(cfg, state).stage('production').deploy();
*/

export default Project;
