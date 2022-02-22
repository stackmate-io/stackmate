import { Memoize } from 'typescript-memoize';
import { groupBy, map } from 'lodash';

import Project from '@stackmate/core/project';
import Provisioner from '@stackmate/core/provisioner';
import { CloudRegistry } from '@stackmate/core/registry';
import { SERVICE_TYPE } from '@stackmate/constants';
import { CloudService } from '@stackmate/interfaces';

abstract class Operation {
  /**
   * @var {Project} project the project to deploy
   */
  protected readonly project: Project;

  /**
   * @var {String} stage the stage to deploy
   */
  protected readonly stageName: string;

  /**
   * @var {Provisioner} provisioner the stack handler & provisioner
   */
  protected readonly provisioner: Provisioner;

  /**
   * @var {Object} options any additional options for the operation
   */
  protected readonly options: object = {};

  /**
   * @constructor
   * @param {Project} project the project that the operation refers to
   * @param {String} stageName the name of the stage we're provisioning
   * @param {Object} options any additional options for the operation
   */
  constructor(project: Project, stageName: string, options: object = {}) {
    this.project = project;
    this.stageName = stageName;
    this.options = options;
    this.provisioner = new Provisioner(project.name, stageName);
  }

  /**
   * @returns {Array<CloudService>} the list of services associated with the stage
   */
  @Memoize() get services() {
    const { secrets: vaultConfig, stages: { [this.stageName]: stageServices } } = this.project;

    const allServices = [
      { type: SERVICE_TYPE.VAULT, ...vaultConfig },
      ...Object.values(stageServices),
    ];

    const instances: CloudService[] = [];
    const groupped = groupBy(allServices, 'provider');

    Object.keys(groupped).map(provider => {
      const serviceAttributes = groupped[provider];
      const regions = map(serviceAttributes, 'region');

      const cloud = CloudRegistry.get({ provider }).factory({ regions });
      instances.push(...cloud.services(serviceAttributes));
    });

    return instances;
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
    return new this(project, stageName);
  }
}

export default Operation;
