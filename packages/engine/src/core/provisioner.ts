import { Memoize } from 'typescript-memoize';
import { isEmpty, sortBy, uniqBy } from 'lodash';

import App from '@stackmate/engine/lib/terraform/app';
import { SERVICE_TYPE } from '@stackmate/engine/constants';
import {
  BaseService,
  BaseServices,
  ServiceTypeChoice,
  CloudStack,
  StackProvisioner,
  EnvironmentVariable,
} from '@stackmate/engine/types';

class Provisioner implements StackProvisioner {
  /**
   * @var {BaseServices.State.Type} state the project's state service
   */
  protected state: BaseServices.State.Type;

  /**
   * @var {BaseServices.Vault.Type} vault the project's vault service
   */
  protected vault: BaseServices.Vault.Type;

  /**
   * @var {BaseServices.Provider.Type[]} providers the list of providers for the services
   */
  protected providers: BaseServices.Provider.Type[];

  /**
   * @var {BaseService.Type[]} services the list of cloud services to deploy
   */
  protected services: BaseService.Type[];

  /**
   * @var {CloudStack} stack the cloud stack context to deploy services on
   */
  protected stack: CloudStack;

  /**
   * @var {String} registered the list of service identifiers that are registered to the stack
   */
  protected registered: string[];

  /**
   * @var {Map} environments the environment variables required by the services
   */
  protected environments: EnvironmentVariable[] = [];

  /**
   * @var {Map} priorities the priorities to register services by
   */
  readonly priorities: Map<ServiceTypeChoice, number> = new Map([
    [SERVICE_TYPE.PROVIDER, 1],
    [SERVICE_TYPE.VAULT, 2],
    [SERVICE_TYPE.STATE, 3],
  ]);

  /**
   * @constructor
   * @param {String} appName the application's name
   * @param {String} stackName the stack's name
   * @param {String} outputPath the path to write the output for
   */
  constructor(appName: string, stackName: string, outputPath?: string) {
    const app = new App(appName, { outdir: outputPath });
    this.stack = app.stack(stackName);
  }

  /**
   * Registers a list of services into the stack
   *
   * @param {BaseService.Type[]} srvs the services to register
   */
  register(...srvs: BaseService.Type[]) {
    // Order the services by priorities so that we make sure that we first register
    // "provider" service types, then the vault, the state and everything else afterwards
    sortBy(srvs, [(srv) => this.priorities.get(srv.type) || -1]).forEach(this.registerService);

    // Now that the services are registered, apply the links for the cloud services only
    this.services.forEach(this.applyLinks);
  }

  /**
   * Returns the list of environment variables required to run the stack
   */
  @Memoize() environment() {
    return uniqBy(this.environments, (env) => env.name);
  }

  /**
   * @returns {Object} the object describing the stack
   */
  generate(): object {
    return this.stack.toTerraform();
  }

  /**
   * Registers a service into the stack
   *
   * @param {BaseService.Type} service the service to register
   */
  protected registerService(service: BaseService.Type) {
    let prerequisites = {};

    if (this.registered.includes(service.identifier)) {
      throw new Error(
        `Service ${service.identifier} of type ${service.type} is already registered into the stack`,
      );
    }

    switch(service.type) {
      case SERVICE_TYPE.STATE:
        prerequisites = { provider: this.getProviderFor(service) };
        this.state = service as BaseServices.State.Type;
        break;
      case SERVICE_TYPE.VAULT:
        prerequisites = { provider: this.getProviderFor(service) };
        this.vault = service as BaseServices.Vault.Type;
        break;
      case SERVICE_TYPE.PROVIDER:
        this.providers.push(service as BaseServices.Provider.Type);
        break;
      default:
        if (!this.vault) {
          throw new Error(
            'No vault service available. Did you forget to register it prior to the service?',
          );
        }
        prerequisites = { vault: this.vault, provider: this.getProviderFor(service) };
        this.services.push(service);
        break;
    }

    // Register the provisions into the stack
    service.provisions(this.stack, prerequisites);

    // Copy the environment variables required
    this.environments.push(...service.environment());
  }

  /**
   * Links a service with its dependencies
   *
   * @param {BaseService.Type} service the service to link
   */
  protected applyLinks(service: BaseService.Type) {
    if (isEmpty(service.links)) {
      return;
    }

    this.services.filter(
      srv => service.links.includes(srv.name),
    ).forEach(
      linked => this.associateServices(service, linked),
    );
  }

  /**
   * Associates two services
   * @param {BaseService.Type} target the service apply the links to
   * @param {BaseService.Type} linked the linked service
   */
  protected associateServices(target: BaseService.Type, linked: BaseService.Type) {
    // Skip linking to the same service
    if (target.identifier === linked.identifier) {
      return;
    }

    // Find the handlers for every associated service
    // The linked service should pass the `match` function test,
    // and should contain a set of handler functions
    target.associations().forEach(({ match, handler }) => {
      // No handlers, or the service didn't match, bail...
      if (!match(linked)) {
        throw new Error(
          `Service ${target.name} of type ${target.type} is linked to service ${linked.name} of type ${linked.type} but there wasn't any handler match in associations()`,
        );
      }

      // Apply the target service as a "this" context and pass the linked one and stack as args
      handler.call(target, linked, this.stack);
    });
  }

  /**
   * Returns the provider instance that is registered into the stack, for a given service
   *
   * @param {BaseService.Type} service the service to get the registered provider for
   * @returns {BaseServices.Provider.Type} the provider instance
   */
  protected getProviderFor(service: BaseService.Type): BaseServices.Provider.Type {
    const { provider, region = null } = service;
    const instance = this.providers.find(p => p.provider === provider && p.region === region);

    if (!instance) {
      throw new Error(
        `No provider found for service ${service.identifier} or isn’t yet registered into the stack`,
      );
    }

    return instance;
  }
}

export default Provisioner;
