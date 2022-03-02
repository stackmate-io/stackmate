import App from '@stackmate/lib/terraform/app';
import PriorityQueue from '@stackmate/lib/queue';
import { CloudApp, CloudService, CloudStack } from '@stackmate/interfaces';
import { SERVICE_TYPE } from '@stackmate/constants';
import { ServiceTypeChoice } from '@stackmate/types';

class Provisioner {
  /**
   * @var {CloudApp} app the terraform application to deploy
   */
  readonly app: CloudApp;

  /**
   * @var {CloudStack} stack the stack to deploy
   */
  readonly stack: CloudStack;

  /**
   * @var {PriorityQueue<CloudService>} queue the sorted priority queue that holds the services
   */
  readonly queue: PriorityQueue<CloudService> = new PriorityQueue();

  /**
   * @var {Map} dependencies a mapping of service name and the services it depends upon
   *                         ie. they should be registered before service.name is registered
   */
  protected readonly dependencies: Map<string, CloudService[]> = new Map();

  /**
   * @var {Map} dependables a mapping of service name and the services that depend upon it
   *                        ie. service.name should be registered before the dependables are
   */
  protected readonly dependables: Map<string, CloudService[]> = new Map();

  /**
   * @var {ServiceTypeChoice[]} highPriority the service types that should be higher in the queue
   */
  protected readonly highPriority: ServiceTypeChoice[] = [
    SERVICE_TYPE.PROVIDER,
    SERVICE_TYPE.VAULT,
    SERVICE_TYPE.STATE,
  ];

  /**
   * @constructor
   * @param {String} appName the application's name
   * @param {String} stackName the stack's name
   */
  constructor(appName: string, stageName: string) {
    this.app = new App(appName);
    this.stack = this.app.stack(stageName);
  }

  /**
   * @returns {Array<CloudService>} the list of services in the queue
   */
  get services(): CloudService[] {
    return this.queue.all;
  }

  /**
   * @param {Array<CloudService>} services the list of services to add to the queue
   */
  set services(services: CloudService[]) {
    services.forEach((service) => {
      // Find the dependencies and dependables for the service
      services.forEach((dep) => {
        if (service.isAssociatedWith(dep)) {
          const dependencies = this.dependencies.get(service.name) || [];
          dependencies.push(dep);

          this.dependencies.set(service.name, dependencies);
        } else if (dep.isAssociatedWith(service)) {
          const dependables = this.dependables.get(service.name) || [];
          dependables.push(dep);

          this.dependables.set(service.name, dependables);
        }
      });

      // Calculate the service's priority and add it to the queue
      this.queue.insert(service, this.priority(service, services.length));
    });
  }

  /**
   * Processes the services and registers them to the stack
   */
  process() {
    // The services are ordered by priority, since the queue is a priority queue
    // This means that we register the ones that are depended by the most services first
    this.services.forEach((service) => {
      // Register the service into the stack
      service.register(this.stack);

      // Make sure the services that are depended on the current service are linked to it
      // Warning: we're passing by reference, which means we're also updating the items in queue
      const dependables = this.dependables.get(service.name) || [];
      dependables.forEach(dep => dep.link(service));
    });
  }

  /**
   * Calculates the priority for a service
   *
   * The weight is defined as:
   *    the total number of services if the current one is a high priority service, zero otherwises
   *
   * The priority is defined as:
   *
   *    the amount of services that depend on the service specified
   *      minus
   *    the amount of services that the service specified depends on
   *
   * @param {CloudService} service the service to calculate the priority for
   * @param {Number} total the total number of services available
   * @returns {Number} the service's priority
   */
  protected priority(service: CloudService, total: number): number {
    const dependables = this.dependables.get(service.name) || [];
    const dependencies = this.dependencies.get(service.name) || [];
    const weight = this.highPriority.includes(service.type) ? total : 0;

    return weight + dependables.length - dependencies.length;
  }
}

export default Provisioner;
