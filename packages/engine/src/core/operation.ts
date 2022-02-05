import { get, groupBy, map, toPairs } from 'lodash';
import { Memoize } from 'typescript-memoize';

import App from '@stackmate/lib/terraform/app';
import Project from '@stackmate/core/project';
import { ProviderChoice } from '@stackmate/types';
import { PROVIDER, SERVICE_TYPE } from '@stackmate/constants';
import { CloudRegistry, ServicesRegistry } from '@stackmate/core/registry';
import { CloudApp, CloudProvider, CloudService, CloudStack, VaultService } from '@stackmate/interfaces';

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
   * @var {CloudApp} app the terraform application to deploy
   */
  protected readonly app: CloudApp;

  /**
   * @var {CloudStack} stack the stack to deploy
   */
  protected readonly stack: CloudStack;

  protected readonly clouds: Map<ProviderChoice, CloudProvider> = new Map();

  protected readonly services: Map<string, CloudService> = new Map();

  /**
   * Runs the operation
   */
  abstract run(): void;

  /**
   * @constructor
   */
  constructor(project: Project, stageName: string) {
    this.project = project;
    this.stageName = stageName;
    this.app = new App(project.name);
    this.stack = this.app.stack(stageName);
    this.initialize();
  }

  protected initialize() {
    const services = Object.values(get(this.project.stages, this.stageName, {}));
    const servicesByProvider = groupBy(services, 'provider');

    toPairs(servicesByProvider).forEach(([provider, services]) => {
      // Populate and register the cloud
      const cloud = CloudRegistry.get({ provider }).factory({
        regions: map(services, 'region'),
        defaults: get(this.project.defaults, provider, {}),
      });

      this.clouds.set(cloud.provider, cloud);

      // Populate and register the cloud prerequisites
      cloud.prerequisites().forEach(prereq => {
        // const prereq = ServicesRegistry.get({ provider, type }).factory(attrs);
        this.services.set(prereq.name, prereq);
      });

      // Populate and register the
      services.forEach(({ type, ...attrs }) => {
        const service = ServicesRegistry.get({ provider, type }).factory(attrs);
        this.services.set(service.name, service);
      });
    });
  }

  @Memoize() get vault(): VaultService {
    const query = { provider: PROVIDER.AWS, type: SERVICE_TYPE.VAULT };
    const { provider = this.project.provider, ...attributes } = this.project.secrets;
    return ServicesRegistry.get(query).factory(attributes) as VaultService;
  }

  @Memoize() get state() {}

  @Memoize() get localState() {}

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
