import { pipe } from 'lodash/fp';
import { isEmpty, uniqBy } from 'lodash';

import Registry from '@stackmate/engine/core/registry';
import { hashObject } from '@stackmate/engine/lib';
import { getStack, Stack } from '@stackmate/engine/core/stack';
import { validate, validateEnvironment } from '@stackmate/engine/core/validation';
import { getStageServices, Project, withLocalState } from '@stackmate/engine/core/project';
import { BaseService, BaseServiceAttributes, Provisions, ServiceEnvironment, ServiceScopeChoice } from '@stackmate/engine/core/service';
import { getServiceProfile } from './profile';

/**
 * @type {Provisionable} represents a piece of configuration and service to be deployed
 */
export type Provisionable = {
  id: string;
  config: BaseServiceAttributes;
  service: BaseService;
};

/**
 * @type {Operation} an operation that synthesizes the terraform files
 */
export type Operation = {
  readonly stack: Stack;
  readonly scope: ServiceScopeChoice;
  readonly provisionables: Provisionable[];
  register(provisionable: Provisionable): void;
  environment(): ServiceEnvironment[];
  process(): object;
};

class StageOperation implements Operation {
  /**
   * @var {Stack} stack the stack to deploy
   * @readonly
   */
  readonly stack: Stack;

  /**
   * @var {ServiceScopeChoice} scope the services scope
   * @readonly
   */
  readonly scope: ServiceScopeChoice;

  /**
   * @var {Provisionable[]} provisionables the list of provisionable services
   */
  readonly provisionables: Provisionable[];

  /**
   * @var {Map<Provisionable['id'], Provisions>} provisions map of provisionable id to provisions
   * @protected
   * @readonly
   */
  protected readonly provisions: Map<Provisionable['id'], Provisions> = new Map();

  /**
   * @constructor
   * @param {BaseServiceAttributes[]} services the services to provision
   * @param {Stack} stack the stage's stack
   * @param {ServiceScopeChoice} scope the services provisionable scope
   */
  constructor(
    services: BaseServiceAttributes[], stack: Stack, scope: ServiceScopeChoice = 'deployable',
  ) {
    this.stack = stack;
    this.scope = scope;
    this.provisionables = services.map(config => ({
      id: hashObject(config),
      config,
      service: Registry.fromConfig(config),
    }));
  }

  /**
   * Returns the environment variables required by the services
   *
   * @returns {ServiceEnvironment[]} the environment variables
   */
  environment(): ServiceEnvironment[] {
    const envVariables = this.provisionables.map(
      p => p.service.environment,
    ).filter(
      e => !isEmpty(e),
    ).flat();

    return uniqBy(envVariables, e => e.name);
  }

  /**
   * Registers a provisionable and its associations to the stack
   *
   * @param {Provisionable} provisionable the provisionable to register
   */
  register(provisionable: Provisionable): void {
    // Item has already been provisioned, bail...
    if (this.provisions.has(provisionable.id)) {
      return;
    }

    const { config, service, service: { handlers, associations = [] } } = provisionable;

    const registrationHandler = handlers.get(this.scope);
    // Item has no handler for the current scope, bail...
    // ie. it only has a handler for deployment, and we're running a 'setup' operation
    if (!registrationHandler) {
      return;
    }

    // Validate the configuration
    validate(service.schemaId, config);

    // Start extracting the service's requirements
    const requirements = {};

    associations.filter(
      // Only keep associations that are meant for the current scope
      ({ scope: associationScope }) => associationScope === this.scope,
    ).forEach(assoc => {
      const {
        where: isAssociated,
        handler: associationHandler,
        from: associatedServiceType,
        as: associationName,
      } = assoc;

      // Get the provisionables associated with the current service configuration
      const associatedProvisionables = this.provisionables.filter((linked) => (
        linked.service.type === associatedServiceType && isAssociated(config, linked.config)
      ));

      // Register associated services into the stack and form the requirements
      associatedProvisionables.forEach((linked) => {
        this.register(linked);

        Object.assign(requirements, {
          [associationName]: associationHandler(linked, this.stack),
        });
      });
    });

    // Register the current service into the stack and mark as provisioned
    const provisions = registrationHandler(config, this.stack, requirements);
    this.provisions.set(provisionable.id, provisions);
  }

  /**
   * Processes an operation and returns the Terraform configuration as an object
   *
   * @returns {Object} the terraform configuration object
   */
  process(): object {
    validateEnvironment(this.environment());
    this.provisionables.forEach(provisionable => this.register(provisionable));
    return this.stack.context.toTerraform();
  }
};

/**
 * Returns an operation for a project, stage and services
 *
 * @param {String} projectName the project's name
 * @param {String} stageName the stage's name
 * @param {ServiceScopeChoice} scope the operation's scope
 * @returns
 */
const getOperation = (
  projectName: string, stageName: string, scope: ServiceScopeChoice,
) => (services: BaseServiceAttributes[]): Operation => {
  const stack = getStack(projectName, stageName);
  return new StageOperation(services, stack, scope);
};

/**
 * Returns a deployment operation
 *
 * @param {Project} config the project's configuration
 * @param {String} stage the stage's name
 * @returns {Operation} the deployment operation
 */
export const deployment = (config: Project, stage: string) => pipe(
  getStageServices(stage),
  getOperation(config.name, stage, 'deployable'),
)(config);

/**
 * Returns a destruction operation
 *
 * @param {Project} config the project's configuration
 * @param {String} stage the stage's name
 * @returns {Operation} the destruction operation
 */
export const destruction = (config: Project, stage: string) => pipe(
  getStageServices(stage),
  getOperation(config.name, stage, 'destroyable'),
)(config);

/**
 * Returns a setup operation (which uses a local state service)
 *
 * @param {Project} config the project's configuration
 * @param {String} stage the stage's name
 * @returns {Operation} the destruction operation
 */
export const setup = (config: Project, stage: string) => pipe(
  getStageServices(stage),
  withLocalState(),
  getOperation(config.name, stage, 'preparable'),
)(config);
