import pipe from '@bitty/pipe';
import { isEmpty, uniqBy } from 'lodash';

import { Registry } from '@stackmate/engine/core/registry';
import { hashObject } from '@stackmate/engine/lib';
import { getStack, Stack } from '@stackmate/engine/core/stack';
import { DEFAULT_PROJECT_NAME } from '@stackmate/engine/constants';
import { validate, validateEnvironment } from '@stackmate/engine/core/validation';
import { getServiceConfigurations, Project, withLocalState } from '@stackmate/engine/core/project';
import {
  assertRequirementsSatisfied,
  BaseServiceAttributes, getProvisionableResourceId, Provisionable, Provisions,
  ServiceEnvironment, ServiceScopeChoice,
} from '@stackmate/engine/core/service';

type ProvisionablesMap = Map<Provisionable['id'], Provisionable>;

export type OperationType = 'deployment' | 'destruction' | 'setup';
export const OPERATION_TYPE: Record<string, OperationType> = {
  DEPLOYMENT: 'deployment',
  DESTRUCTION: 'destruction',
  SETUP: 'setup',
} as const;

/**
 * @type {Operation} an operation that synthesizes the terraform files
 */
export type Operation = {
  readonly stack: Stack;
  readonly scope: ServiceScopeChoice;
  readonly provisionables: ProvisionablesMap;
  environment(): ServiceEnvironment[];
  process(): object;
};

/**
 * @param {BaseServiceAttributes} config the service's configuration
 * @param {String} stageName the name of the stage to register resources to
 * @returns {Provisionable} the provisionable to use in operations
 */
export const getProvisionableFromConfig = (
  config: BaseServiceAttributes, stageName: string,
): Provisionable => ({
  id: hashObject(config),
  config,
  service: Registry.fromConfig(config),
  requirements: {},
  resourceId: getProvisionableResourceId(config, stageName),
});

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
   * @var {ServiceEnvironment[]} #environment the environment variables required for the operation
   */
  #environment: ServiceEnvironment[];

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
      const provisionable = getProvisionableFromConfig(config, this.stack.stageName);
      this.provisionables.set(provisionable.id, provisionable);
    });
  }

  /**
   * Returns the environment variables required by the services
   *
   * @returns {ServiceEnvironment[]} the environment variables
   */
  environment(): ServiceEnvironment[] {
    if (!this.#environment) {
      const envVariables = Array.from(this.provisionables.values()).map(
        p => p.service.environment,
      ).filter(
        e => !isEmpty(e),
      ).flat();

      this.#environment = uniqBy(envVariables, e => e.name);
    }

    return this.#environment;
  }

  /**
   * Registers a provisionable and its associations to the stack
   *
   * @param {Provisionable} provisionable the provisionable to register
   */
  protected register(provisionable: Provisionable): Provisions {
    // Item has already been provisioned, bail...
    const existingProvisions = this.provisionables.get(provisionable.id)?.provisions;
    if (existingProvisions) {
      return existingProvisions;
    }

    const { config, service, service: { handlers, associations = [] } } = provisionable;

    // Validate the configuration
    validate(service.schemaId, config, { useDefaults: true });

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
      const associatedProvisionables = Array.from(this.provisionables.values()).filter((linked) => {
        return linked.service.type === associatedServiceType && (
          typeof isAssociated === 'function' ? isAssociated(config, linked.config) : true
        );
      });

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
    Object.assign(provisionable, { requirements });
    assertRequirementsSatisfied(provisionable, this.scope);

    const registrationHandler = handlers.get(this.scope);
    // no handler exists for the current scope,
    // eg. it only has a handler for deployment, we're running a 'setup'
    const provisions = registrationHandler ? registrationHandler(provisionable, this.stack) : {};

    Object.assign(provisionable, { provisions });

    this.provisionables.set(provisionable.id, provisionable);
    return provisions;
  }

  /**
   * Processes an operation and returns the Terraform configuration as an object
   *
   * @returns {Object} the terraform configuration object
   */
  process(): object {
    validateEnvironment(this.environment());
    this.provisionables.forEach(provisionable => this.register(provisionable));
    return this.stack.toObject();
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
 * @param {Project} project the project's configuration
 * @param {String} stage the stage's name
 * @returns {Operation} the deployment operation
 */
export const deployment = (project: Project, stage: string) => (
  pipe(
    getServiceConfigurations(stage),
    getOperation(project.name || DEFAULT_PROJECT_NAME, stage, 'deployable'),
  )(project)
);

/**
 * Returns a destruction operation
 *
 * @param {Project} project the project's configuration
 * @param {String} stage the stage's name
 * @returns {Operation} the destruction operation
 */
export const destruction = (project: Project, stage: string) => (
  pipe(
    getServiceConfigurations(stage),
    getOperation(project.name || DEFAULT_PROJECT_NAME, stage, 'destroyable'),
  )(project)
);

/**
 * Returns a setup operation (which uses a local state service)
 *
 * @param {Project} project the project's configuration
 * @param {String} stage the stage's name
 * @returns {Operation} the destruction operation
 */
export const setup = (project: Project, stage: string) => (
  pipe(
    getServiceConfigurations(stage),
    withLocalState(),
    getOperation(project.name || DEFAULT_PROJECT_NAME, stage, 'preparable'),
  )(project)
);

/**
 * Returns an operation by its name
 *
 * @param {OperationType} operation the operation to get
 * @param {Project} project the validated project configuration
 * @param {String} stage the stage name
 * @returns {Operation} the operation to use
 */
export const getOperationByName = (
  operation: OperationType, project: Project, stage: string,
): Operation => {
  switch (operation) {
    case OPERATION_TYPE.DEPLOYMENT:
      return deployment(project, stage);

    case OPERATION_TYPE.DESTRUCTION:
      return destruction(project, stage);

    case OPERATION_TYPE.SETUP:
      return setup(project, stage);

    default:
      throw new Error(`Operation ${operation} is invalid`);
  }
};
