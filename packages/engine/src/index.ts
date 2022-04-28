import Project from './core/project';
import Registry from './core/registry';
import DeployOperation from './operations/deploy';
import DestroyOperation from './operations/destroy';
import PrepareOperation from './operations/prepare';
import {
  OperationConstructor, OperationOptions, PrepareOperationOptions,
  ProjectConfiguration, StackmateOperation,
} from './types';

// Export types
export * from './types';

// Export constants
export * from './constants';

// Export Provider constants
export * from './providers/aws/constants';

// Export error classes
export * from './lib/errors';

// Export core objects
export {
  Project,
  Registry,
};

/**
 * Returns an operation based on a given class
 *
 * @param {OperationConstructor} Cls the class to instantiate
 * @param {ProjectConfiguration} config the project's configuration
 * @param {String} stage the stage to operate
 * @param {OperationOptions} options any options to pass to the operation
 * @returns {StackmateOperation} the operation instance
 */
const getOperation = (
  Cls: OperationConstructor,
  config: ProjectConfiguration,
  stage: string,
  options: OperationOptions = {},
): StackmateOperation => {
  return new Cls(Project.factory(config), stage, options);
};

// Export operations
export namespace Operations {
  /**
   * Returns a deployment operation
   *
   * @param {ProjectConfiguration} config the project's configuration
   * @param {String} stage the stage to operate
   * @param {OperationOptions} options any options to pass to the operation
   * @returns {DeployOperation} the operation instance
   */
  export const deployment = (
    config: ProjectConfiguration, stage: string, options: OperationOptions = {},
  ) => (
    getOperation(DeployOperation, config, stage, options)
  );

  /**
   * Returns a destruction operation
   *
   * @param {ProjectConfiguration} config the project's configuration
   * @param {String} stage the stage to operate
   * @param {OperationOptions} options any options to pass to the operation
   * @returns {DeployOperation} the operation instance
   */
  export const destroy = (
    config: ProjectConfiguration, stage: string, options: OperationOptions = {},
  ) => (
    getOperation(DestroyOperation, config, stage, options)
  );

  /**
   * Returns a preparation operation
   *
   * @param {ProjectConfiguration} config the project's configuration
   * @param {String} stage the stage to operate
   * @param {OperationOptions} options any options to pass to the operation
   * @returns {DeployOperation} the operation instance
   */
  export const prepare = (
    config: ProjectConfiguration, stage: string, options: PrepareOperationOptions = {},
  ) => (
    getOperation(PrepareOperation, config, stage, options)
  );
};
