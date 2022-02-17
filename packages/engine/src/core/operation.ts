import { Memoize } from 'typescript-memoize';
import { groupBy, head, pick } from 'lodash';

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

  @Memoize() get services() {
    const { secrets, stages: { [this.stageName]: services } } = this.project;

    const stageServices = [
      ...Object.values(services),
      { type: SERVICE_TYPE.VAULT, ...secrets },
    ];

    const instances: CloudService[] = [];
    const groupped = groupBy(stageServices, ({ provider, region }) => `${provider}-${region}`);

    Object.values(groupped).map(serviceGroup => {
      const cloudAttrs = pick(head(serviceGroup), 'provider', 'region');
      Object.assign(cloudAttrs, { isDefault: cloudAttrs.region === this.project.region });

      const cloud = CloudRegistry.get(cloudAttrs).factory(cloudAttrs);
      instances.push(...cloud.services(serviceGroup));
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
