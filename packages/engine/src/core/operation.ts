import Project from '@stackmate/core/project';

abstract class Operation {
  /**
   * @var {Project} project the project to deploy
   */
  protected project: Project;

  /**
   * Runs the operation
   */
  abstract run(): void;

  /**
   * @constructor
   * @param {ProjectStage} stage the stage to perform the operation on
   */
  constructor(project: Project) {
    this.project = project;
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
    project.select(stageName);
    return new this(project);
  }
}

export default Operation;
