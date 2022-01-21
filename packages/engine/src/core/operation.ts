import Project from '@stackmate/core/project';
import { ProjectStage } from '@stackmate/interfaces';

abstract class Operation {
  /**
   * @var {ProjectStage} stage the stage to deploy
   */
  protected stage: ProjectStage;

  /**
   * Runs the operation
   */
  abstract run(): void;

  /**
   * @constructor
   * @param {ProjectStage} stage the stage to perform the operation on
   */
  constructor(stage: ProjectStage) {
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

    return new this(stage);
  }
}

export default Operation;
