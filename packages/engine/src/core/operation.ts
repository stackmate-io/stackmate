import { isEmpty, uniq } from 'lodash';

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
   * @var {BaseService.Type[]} services the list of services to deploy
   */
  readonly services: BaseService.Type[]

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
  constructor(services: BaseService.Type[], options: OperationOptions = {}) {
    this.services = services;
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
   * Synthesizes the operation's stack
   */
  synthesize(): object {
    return this.provisioner.process();
  }
}

export default Operation;
