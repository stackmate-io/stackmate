import Stage from 'core/stage';
import Configuration from 'core/configuration';

class Project {
  stage: Stage;

  configuration: Configuration;

  constructor(path: string) {
    this.configuration = new Configuration(path);
  }

  async load() {
    await this.configuration.load();

    // load state file
    // load the vault
    // apply vault credentials to services
  }

  useStage(name: string): Stage {
    // populate the stage
    // validate
  }

  validate() {
  }

  async deploy(stage: string) {
    this.useStage(stage).prepare();
  }

  async destroy(stage: string) {
    this.useStage(stage).prepare();
  }

  async state(stage: string) {
    this.useStage(stage);
  }

  async vault() {
  }

  static async factory(path: string) {
    const project = new Project(path);
    await project.load();
    return project;
  }
}

/*
Usage:
await Project.load(cfg, state).deploy('production');
*/

export default Project;
