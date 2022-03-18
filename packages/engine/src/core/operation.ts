import { Memoize } from 'typescript-memoize';
import { pick, uniqBy } from 'lodash';

import Project from '@stackmate/engine/core/project';
import Provisioner from '@stackmate/engine/core/provisioner';
import ServicesRegistry from '@stackmate/engine/core/registry';
import { SERVICE_TYPE } from '@stackmate/engine/constants';
import { OperationOptions, ProjectConfiguration } from '@stackmate/engine/types';

abstract class Operation {
  /**
   * @var {Provisioner} provisioner the stack handler & provisioner
   */
  readonly provisioner: Provisioner;

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
   * Synthesizes the operation's stack
   */
  abstract synthesize(): void;

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

    const { outputPath } = this.options;
    this.provisioner = new Provisioner(project.name, stageName, outputPath);
  }

  /**
   * @returns {Array<CloudService>} the list of services associated with the stage
   */
  @Memoize() get services() {
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
   * Starts an operation
   *
   * @param {String} projectFile the project file to load
   * @param {String} stageName the name of the stage to select
   * @returns {Promise<Operation>}
   */
  static factory<T extends Operation>(
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
