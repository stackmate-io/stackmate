import Project from '@stackmate/core/project';
import Stage from '@stackmate/core/stage';

abstract class Operation {
  /**
   * @var {Project} project the project to deploy
   */
  protected readonly project: Project;

  /**
   * @var {Stage} stage the stage to deploy
   */
  protected readonly stage: Stage;

  /**
   * Runs the operation
   */
  abstract run(): void;

  /**
   * @constructor
   * @param {ProjectStage} stage the stage to perform the operation on
   */
  constructor(project: Project, stage: Stage) {
    this.project = project;
    this.stage = stage;
  }

  /**
   * Starts an operation
   *
   * @param {String} projectFile the project file to load
   * @param {String} stageName the name of the stage to select
   * @returns {Promise<Operation>}
   */
  static async factory<T extends Operation>(
    this: new (...args: any[]) => T,
    projectFile: string,
    stageName: string,
  ): Promise<T> {
    const project = await Project.load(projectFile);
    const stage = project.select(stageName);
    return new this(project, stage);
  }
}

export default Operation;
