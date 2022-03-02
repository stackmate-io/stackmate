import { Memoize } from 'typescript-memoize';
import { pick, uniqBy } from 'lodash';

import Project from '@stackmate/core/project';
import Provisioner from '@stackmate/core/provisioner';
import ServicesRegistry from '@stackmate/core/registry';
import { SERVICE_TYPE } from '@stackmate/constants';

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
    const { PROVIDER, VAULT } = SERVICE_TYPE;
    const { secrets: vaultAttrs, stages: { [this.stageName]: stage } } = this.project;
    const serviceAtrs = Object.values(stage);
    const defaults = { projectName: this.project.name, stageName: this.stageName };

    const vault = {
      name: 'project-vault',
      type: VAULT,
      ...defaults,
      ...vaultAttrs,
    };

    const providers = uniqBy(serviceAtrs.map(srv => pick(srv, 'provider', 'region')), attrs => (
      Object.keys(attrs).join('-')
    )).map(({ provider, region }) => ({
      type: PROVIDER, name: `provider-${provider}-${region}`, provider, region, ...defaults,
    }));

    return [vault, ...providers, ...Object.values(stage)].map(srv => {
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
