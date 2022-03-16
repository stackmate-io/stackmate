import DeployOperation from './operations/deploy';
import DestroyOperation from './operations/destroy';
import PrepareOperation from './operations/prepare';
import { OperationOptions, PrepareOperationOptions } from './types';

/**
 * Provides the configuration to deploy a stage
 *
 * @param {String} projectFile the project's configuration file
 * @param {String} stage the name of the stage to deploy
 * @param {Object} options the operation's options
 * @param {String} options.outputPath the path to output the files to (optional)
 */
export const deployStage = async (
  projectFile: string, stage: string, options: OperationOptions = {},
): Promise<void> => {
  const operation = await DeployOperation.factory(projectFile, stage);
  await operation.run();
};

/**
 * Provides the configuration to destroy a stage
 *
 * @param {String} projectFile the project's configuration file
 * @param {String} stage the name of the stage to deploy
 * @param {Object} options the operation's options
 * @param {String} options.outputPath the path to output the files to (optional)
 */
export const destroyStage = async (
  projectFile: string, stage: string, options: OperationOptions = {},
): Promise<void> => {
  const operation = await DestroyOperation.factory(projectFile, stage, options);
  await operation.run();
};

/**
 * Provides the configuration to prepare a stage
 *
 * @param {String} projectFile the project's configuration file
 * @param {String} stage the name of the stage to deploy
 * @param {Object} options the operation's options
 * @param {String} options.outputPath the path to output the files to (optional)
 * @param {String} options.statePath the path to store the state to
 */
export const prepareStage = async (
  projectFile: string, stage: string, options: PrepareOperationOptions = {},
): Promise<void> => {
  const operation = await PrepareOperation.factory(projectFile, stage, options);
  await operation.run();
};

