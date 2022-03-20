import { Memoize } from 'typescript-memoize';
import { pick, uniqBy } from 'lodash';

import Project from '@stackmate/engine/core/project';
import ServicesRegistry from '@stackmate/engine/core/registry';
import { SERVICE_TYPE } from '@stackmate/engine/constants';
import { WithStaticType } from '@stackmate/engine/lib/decorators';
import {
  CloudService,
  Provisionable,
  OperationOptions,
  ProjectConfiguration,
  StackmateOperation,
  OperationFactory,
} from '@stackmate/engine/types';

@WithStaticType<OperationFactory>()
abstract class Operation implements StackmateOperation {
  /**
   * @var {Project} project the project to deploy
   */
  protected readonly project: Project;

  /**
   * @var {String} stage the stage to deploy
   */
  protected readonly stageName: string;

  /**
   * @var {Object} options any additional options for the operation
   */
  protected readonly options: OperationOptions = {};

  /**
   * @returns {Provisionable} the provisioner with the services assigned
   */
  abstract get provisioner(): Provisionable;

  /**
   * @constructor
   * @param {Project} project the project that the operation refers to
   * @param {String} stageName the name of the stage we're provisioning
   * @param {Object} options any additional options for the operation
   */
  constructor(project: Project, stageName: string, options: OperationOptions = {}) {
    this.project = project;
    this.stageName = stageName;
    this.options = options;
  }

  /**
   * @returns {Array<CloudService>} the list of services associated with the stage
   */
  @Memoize() get services(): CloudService[] {
    const { PROVIDER, VAULT, STATE } = SERVICE_TYPE;
    const { secrets, state, stages: { [this.stageName]: stage } } = this.project;
    const serviceAtrs = Object.values(stage);
    const defaults = { projectName: this.project.name, stageName: this.stageName };

    const prerequisites = [
      { type: VAULT, ...defaults, ...secrets },
      { type: STATE, ...defaults, ...state },
    ];

    const providers = uniqBy(serviceAtrs.map(srv => pick(srv, 'provider', 'region')), attrs => (
      Object.keys(attrs).join('-')
    )).map(({ provider, region }) => ({
      type: PROVIDER, name: `provider-${provider}-${region}`, provider, region, ...defaults,
    }));

    return [...providers, ...prerequisites, ...Object.values(stage)].map(srv => {
      const { type, provider } = srv;
      return ServicesRegistry.get({ type, provider }).factory({ ...srv, ...defaults });
    });
  }

  /**
   * Synthesizes the operation's stack
   */
  synthesize(): object {
    return this.provisioner.process();
  }

  /**
   * Starts an operation
   *
   * @param {String} projectFile the project file to load
   * @param {String} stageName the name of the stage to select
   * @returns {Promise<Operation>}
   */
  static factory<T extends StackmateOperation>(
    this: new (...args: any[]) => T,
    projectConfig: ProjectConfiguration,
    stageName: string,
    options: object = {},
  ): T {
    const project = Project.factory(projectConfig);
    return new this(project, stageName, options);
  }
}

export default Operation;
