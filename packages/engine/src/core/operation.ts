import pipe from '@bitty/pipe';
import { isEmpty, uniqBy } from 'lodash';

import Registry from '@stackmate/engine/core/registry';
import { hashObject } from '@stackmate/engine/lib';
import { getStack, Stack } from '@stackmate/engine/core/stack';
import { validate, validateEnvironment } from '@stackmate/engine/core/validation';
import { getStageServices, Project, withLocalState } from '@stackmate/engine/core/project';
import {
  BaseServiceAttributes, Provisionable, Provisions, ServiceConfiguration,
  ServiceEnvironment, ServiceScopeChoice,
} from '@stackmate/engine/core/service';

type ProvisionablesMap = Map<Provisionable['id'], Provisionable>;

/**
 * @type {Operation} an operation that synthesizes the terraform files
 */
export type Operation = {
  readonly stack: Stack;
  readonly scope: ServiceScopeChoice;
  readonly provisionables: ProvisionablesMap;
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
   * @var {ProvisionablesMap} provisionables the list of provisionable services
   */
  readonly provisionables: ProvisionablesMap = new Map();

  /**
   * @var {ServiceEnvironment[]} _environment the environment variables required for the operation
   */
  private _environment: ServiceEnvironment[];

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
    this.setUpProvisionables(services);
  }

  /**
   * Creates the provisionables map from the list of services
   *
   * @param {BaseServiceAttributes[]} services the services to create the provisionables from
   */
  protected setUpProvisionables(services: BaseServiceAttributes[]) {
    services.forEach((config) => {
      const provisionable: Provisionable = {
        id: hashObject(config),
        config,
        service: Registry.fromConfig(config),
        requirements: {},
        provisions: {},
      };

      this.provisionables.set(provisionable.id, provisionable);
    });
  }

  /**
   * Returns the environment variables required by the services
   *
   * @returns {ServiceEnvironment[]} the environment variables
   */
  environment(): ServiceEnvironment[] {
    if (!this._environment) {
      const envVariables = Array.from(this.provisionables.values()).map(
        p => p.service.environment,
      ).filter(
        e => !isEmpty(e),
      ).flat();

      this._environment = uniqBy(envVariables, e => e.name);
    }

    return this._environment;
  }

  /**
   * Registers a provisionable and its associations to the stack
   *
   * @param {Provisionable} provisionable the provisionable to register
   */
  register(provisionable: Provisionable): Provisions {
    // Item has already been provisioned, bail...
    if (this.provisionables.has(provisionable.id)) {
      return {};
    }

    const { config, service, service: { handlers, associations = [] } } = provisionable;

    const registrationHandler = handlers.get(this.scope);
    // Item has no handler for the current scope, bail...
    // ie. it only has a handler for deployment, and we're running a 'setup' operation
    if (!registrationHandler) {
      return {};
    }

    // Validate the configuration
    validate(service.schemaId, config);

    // Start extracting the service's requirements
    const requirements = {};

    associations.filter(({ scope: associationScope }) => (
      associationScope === this.scope
    )).forEach((association) => {
      const {
        as: associationName,
        where: isAssociated,
        handler: associationHandler,
        from: associatedServiceType,
      } = association;

      // Get the provisionables associated with the current service configuration
      const associatedProvisionables = Array.from(this.provisionables.values()).filter((linked) => (
        linked.service.type === associatedServiceType && (
          typeof isAssociated === 'function' ? isAssociated(config, linked.config) : true
        )
      ));

      // Register associated services into the stack and form the requirements
      associatedProvisionables.forEach((linked) => {
        const linkedProvisions = this.register(linked);
        const linkedProvisionable = { ...linked, provisions: linkedProvisions };

        Object.assign(requirements, {
          [associationName]: associationHandler(linkedProvisionable, this.stack),
        });
      });
    });

    // Register the current service into the stack and mark as provisioned
    // assertRequirementsSatisfied( requirements);
    const updatedProvisionable = { ...provisionable, requirements };
    this.provisionables.set(updatedProvisionable.id, updatedProvisionable);

    return registrationHandler(updatedProvisionable, this.stack);
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
) => (services: ServiceConfiguration[]): Operation => {
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
