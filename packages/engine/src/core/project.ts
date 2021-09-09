import Stage from 'core/stage';

class Project {
  constructor(configFilePath, stateFilePath) {
    this.validate();
  }

  public getStage(name: string): Stage {
    return new Stage(name, {});
  }

  public validate() {
  }
}

/*
Usage:
const project = new Project(cfg, state);
project.stage('production');
await project.deploy();
*/

export default Project;
