import { Memoize } from 'typescript-memoize';
import { isEmpty, pick, uniq, uniqBy } from 'lodash';

import ServicesRegistry from '@stackmate/engine/core/registry';
import { SERVICE_TYPE } from '@stackmate/engine/constants';
import {
  Project,
  BaseService,
  Provisionable,
  ProviderChoice,
  OperationOptions,
  StackmateOperation,
} from '@stackmate/engine/types';

abstract class Operation implements StackmateOperation {
  /**
   * @var {Project.Type} project the project to deploy
   */
  protected readonly project: Project.Type;

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
  constructor(project: Project.Type, stageName: string, options: OperationOptions = {}) {
    this.project = project;
    this.stageName = stageName;
    this.options = options;
  }

  /**
   * @returns {ProviderChoice[]} the list of providers in the services
   */
  get providers(): ProviderChoice[] {
    if (isEmpty(this.services)) {
      throw new Error('The service list is empty. Have you set the services?');
    }

    return uniq(this.services.map(srv => srv.provider));
  }

  /**
   * @returns {Array<CloudService>} the list of services associated with the stage
   */
  @Memoize() get services(): BaseService.Type[] {
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
      return ServicesRegistry.get(provider!, type).factory({ ...srv, ...defaults });
    });
  }

  /**
   * Synthesizes the operation's stack
   */
  synthesize(): object {
    return this.provisioner.process();
  }
}

export default Operation;
