import Project from '@stackmate/engine/core/project';
import Provisioner from '@stackmate/engine/core/provisioner';
import Registry from '@stackmate/engine/core/registry';
import { PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';
import {
  OperationOptions,
  StackProvisioner,
  PrepareOperationOptions,
  ProjectConfiguration as StackmateProject,
} from '@stackmate/engine/types';

/**
 * Returns a deployment operation
 *
 * @param {ProjectConfiguration} config the project's configuration
 * @param {String} stage the stage to operate
 * @param {OperationOptions} options any options to pass to the operation
 * @returns {StackProvisioner} the operation instance
 */
export const deployment = (
  config: StackmateProject.Attributes, stage: string, options: OperationOptions = {},
): StackProvisioner => {
  const project = Project.factory<StackmateProject.Type>(config);

  const provisioner = new Provisioner(project.name, stage, options.outputPath);
  provisioner.register(
    ...project.stage(stage).map(srv => srv.scope('deployable')),
  );

  return provisioner;
};

/**
 * Returns a destruction operation
 *
 * @param {ProjectConfiguration} config the project's configuration
 * @param {String} stage the stage to operate
 * @param {OperationOptions} options any options to pass to the operation
 * @returns {StackProvisioner} the operation instance
 */
export const destroy = (
  config: StackmateProject.Attributes, stage: string, options: OperationOptions = {},
): StackProvisioner => {
  const project = Project.factory<StackmateProject.Type>(config);

  const provisioner = new Provisioner(project.name, stage, options.outputPath);
  provisioner.register(
    ...project.stage(stage).map(srv => srv.scope('destroyable')),
  );

  return provisioner;
};

/**
 * Returns a preparation operation
 *
 * @param {ProjectConfiguration} config the project's configuration
 * @param {String} stage the stage to operate
 * @param {OperationOptions} options any options to pass to the operation
 * @returns {StackProvisioner} the operation instance
 */
export const prepare = (
  config: StackmateProject.Attributes, stage: string, options: PrepareOperationOptions = {},
) => {
  const project = Project.factory<StackmateProject.Type>(config);

  // We use a local state for the state storage when we first prepare the state
  // It should be in deployable state, since this is the only service we're deploying
  const state = Registry.get(PROVIDER.LOCAL, SERVICE_TYPE.STATE).factory({
    type: SERVICE_TYPE.STATE,
    provider: PROVIDER.LOCAL,
    directory: options.statePath,
  }, project.name, stage).scope('deployable');

  // The project's main services need to be of 'preparable' scope so that providers
  // and additional services exist as an instance, but not provisioned into the stack
  const preparables = project.stage(stage).filter(
    srv => srv.type !== SERVICE_TYPE.STATE,
  ).map(
    srv => srv.scope('preparable'),
  );

  const provisioner = new Provisioner(project.name, stage, options.outputPath);
  provisioner.register(state, ...preparables);

  return provisioner;
};
