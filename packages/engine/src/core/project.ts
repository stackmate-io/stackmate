import Stage from 'core/stage';
import Configuration from 'core/configuration';

class Project {
  path: string;

  stage: Stage;

  configuration: Configuration;

  constructor(path: string) {
    this.path;
  }

  async load() {
    // this.configuration = new Configuration(path);
    // load state file
    // load the vault
    // apply vault credentials to services
  }

  useStage(name: string): Stage {
    // populate the stage
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
