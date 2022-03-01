import { Memoize } from 'typescript-memoize';
import { groupBy } from 'lodash';

import Project from '@stackmate/core/project';
import Provisioner from '@stackmate/core/provisioner';
import ServicesRegistry from '@stackmate/core/registry';
import { SERVICE_TYPE } from '@stackmate/constants';
import { CloudService } from '@stackmate/interfaces';

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
    const { secrets: vault, stages: { [this.stageName]: stage } } = this.project;
    const instances: CloudService[] = [];
    const defaultArgs = { projectName: this.project.name, stageName: this.stageName };
    const vaultAttrs = {
      type: VAULT,
      name: `project-vault-${this.stageName}`,
      ...defaultArgs,
      ...vault,
    };

    const stageServices = [vaultAttrs, ...Object.values(stage)];
    const services = groupBy(stageServices, 'provider');
    Object.keys(services).map(provider => {
      const servicesPerRegion = groupBy(services[provider], 'region');
      Object.keys(servicesPerRegion).forEach(region => {
        const cloudAttrs = {
          type: PROVIDER,
          name: `provider-${provider}-${region}`,
          provider,
          region,
          ...defaultArgs,
        };

        const services = [cloudAttrs, ...servicesPerRegion[region]];
        instances.push(
          ...services.map(srv => ServicesRegistry.get({ type: srv.type, provider }).factory(srv)),
        );
      });
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
