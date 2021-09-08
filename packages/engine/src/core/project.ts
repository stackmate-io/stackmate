import Stage from 'core/stage';

class Project {
  constructor(configFilePath, stateFilePath) {
    this.validate();
  }

  public getStage(name: string): Stage {
    const serviceDeclarations = {};
    return new Stage(name, serviceDeclarations);
  }

  public validate() {
  }
}

/*
Usage:
const project = new Project(cfg, state);
const stage = project.getStage('production');
await stage.deploy();
*/

export default Project;
