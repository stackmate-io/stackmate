import Stage from 'core/stage';

class Project {
  stage: Stage;

  constructor(configFilePath) {
  }

  async load() {
    // load configuration file
    // normalize configuration file (apply default attributes & overrides to the stages)
    // load state file
    // load the vault
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

  static async factory() {
  }
}

/*
Usage:
await Project.load(cfg, state).deploy('production');
*/

export default Project;
