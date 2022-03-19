import DeployOperation from './operations/deploy';
import DestroyOperation from './operations/destroy';
import PrepareOperation from './operations/prepare';
import { OperationOptions, PrepareOperationOptions, ProjectConfiguration } from './types';

// Export types
export * from './types';

// Export constants
export * from './constants';

// Export Provider constants
export * from './providers/aws/constants';

// Export error classes
export * from './lib/errors';

/**
 * Provides the configuration to deploy a stage
 *
 * @param {String} projectFile the project's configuration file
 * @param {String} stage the name of the stage to deploy
 * @param {Object} options the operation's options
 * @param {String} options.outputPath the path to output the files to (optional)
 */
export const stageDeployment = async (
  projectConfig: ProjectConfiguration, stage: string, options: OperationOptions = {},
): Promise<void> => {
  const operation = DeployOperation.factory(projectConfig, stage, options);
  operation.synthesize();
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
  projectConfig: ProjectConfiguration, stage: string, options: OperationOptions = {},
): Promise<void> => {
  const operation = DestroyOperation.factory(projectConfig, stage, options);
  operation.synthesize();
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
  projectConfig: ProjectConfiguration, stage: string, options: PrepareOperationOptions = {},
): Promise<void> => {
  const operation = PrepareOperation.factory(projectConfig, stage, options);
  operation.synthesize();
};
