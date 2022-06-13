import { isEmpty, uniq } from 'lodash';

import {
  Project,
  BaseService,
  Provisionable,
  ProviderChoice,
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
  readonly services: BaseService.Type[];

  /**
   * @returns {Provisionable} the provisioner with the services assigned
   */
  readonly provisioner: Provisionable;

  /**
   * Registers the services in the provisioner
   */
  abstract registerServices(): void;

  /**
   * @constructor
   * @param {BaseService.Type[]} services the project's services
   * @param {Provisionable} provisioner the stack to deploy the services to
   */
  constructor(services: BaseService.Type[], provisioner: Provisionable) {
    this.services = services;
    this.provisioner = provisioner;
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
    this.registerServices();
    return this.provisioner.process();
  }
}

export default Operation;
