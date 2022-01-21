import { DEFAULT_PROJECT_FILE, DEFAULT_STAGE } from '@stackmate/constants';

/**
 * Creates and deploys prerequisites for a stage
 *
 * @param {String} projectFile the project file that contains the stage
 * @param {String} stageName the name of the stage to prepare
 * @param {String} targetPath the path to write the output to
 */
const create = async (
  projectFile: string = DEFAULT_PROJECT_FILE,
  stageName: string = DEFAULT_STAGE,
  targetPath: string,
): Promise<void> => {
  /** @todo */
};

/**
 * Deploys a stage
 *
 * @param {String} projectFile the file to use for the project
 * @param {String} stageName the name of the stage to use
 * @param {String} targetPath the path to write the output to
 */
const deploy = async (
  projectFile: string = DEFAULT_PROJECT_FILE,
  stageName: string = DEFAULT_STAGE,
  targetPath?: string,
): Promise<void> => {
  /** @todo */
};

export {
  deploy,
  create,
};
