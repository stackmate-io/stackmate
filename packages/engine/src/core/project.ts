import Stage from '@stackmate/core/stage';
import Configuration from '@stackmate/core/configuration';

class Project {
  /**
   * @var {Configuration} configuration the project's configuration
   * @readonly
   */
  readonly configuration: Configuration;

  stage: Stage;

  constructor(configuration: Configuration) {
    this.configuration = configuration;
  }

  useStage(name: string): Stage {
    const services = this.configuration.stage(name);
    // populate the stage
  }

  async deploy(stage: string) {
    this.useStage(stage).prepare();
  }

  async destroy(stage: string) {
    this.useStage(stage).prepare();
  }

  async state(stage: string | null = null) {
    // this.useStage(stage);
  }

  async vault() {
  }

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
