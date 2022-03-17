import DeployOperation from './operations/deploy';
import DestroyOperation from './operations/destroy';
import PrepareOperation from './operations/prepare';
import { OperationOptions, PrepareOperationOptions } from './types';

// Export types
export * from './types';

// Export constants
export * from './constants';

// Export Provider constants
export * from './providers/aws/constants';

/**
 * Provides the configuration to deploy a stage
 *
 * @param {String} projectFile the project's configuration file
 * @param {String} stage the name of the stage to deploy
 * @param {Object} options the operation's options
 * @param {String} options.outputPath the path to output the files to (optional)
 */
export const stageDeployment = async (
  projectFile: string, stage: string, options: OperationOptions = {},
): Promise<void> => {
  const operation = await DeployOperation.factory(projectFile, stage, options);
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
export const stageDestruction = async (
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
export const initialPreparation = async (
  projectFile: string, stage: string, options: PrepareOperationOptions = {},
): Promise<void> => {
  const operation = await PrepareOperation.factory(projectFile, stage, options);
  await operation.run();
};
