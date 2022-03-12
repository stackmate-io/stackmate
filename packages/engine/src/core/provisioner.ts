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
   * @var {Map} dependables a mapping of service identifier to the services that are depended
   *                        by said service. (eg. "provider" has dependables "vault", "state")
   */
  protected readonly dependables: Map<string, CloudService[]> = new Map();

  /**
   * @var {ServiceTypeChoice[]} weights additional weight to add to the priority for services
   */
  protected readonly weights: Map<ServiceTypeChoice, number> = new Map([
    [SERVICE_TYPE.PROVIDER, 100000],
    [SERVICE_TYPE.STATE, 99999],
    [SERVICE_TYPE.VAULT, 99998],
  ]);

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
      services.forEach((dep) => {
        if (dep.isDependingUpon(service)) {
          // Add the "dep" as a dependable of service
          this.dependables.set(service.identifier, [
            ...(this.dependables.get(service.identifier) || []),
            dep,
          ]);
        }
      });

      // Calculate the service's priority and add it to the queue
      this.queue.insert(service, this.priority(service));
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
      const dependables = this.dependables.get(service.identifier) || [];
      dependables.forEach(dep => dep.link(service));
    });
  }

  /**
   * Calculates the priority for a service
   *
   * The weight is defined as:
   *    the number assigned in the weights mapping for certain services, zero otherwises
   *
   * The priority is defined as:
   *
   *    the amount of services that depend on the service specified
   *      minus
   *    the amount of services that the service specified depends on
   *
   * @param {CloudService} service the service to calculate the priority for
   * @returns {Number} the service's priority
   */
  protected priority(service: CloudService): number {
    const weight = this.weights.get(service.type) || 0;
    // Get the number of services that the current one is depended by
    const dependedByCount = this.dependables.get(service.identifier)?.length || 0;
    // Get the number of services that the current one is depending upon
    const dependsUponCount =  Array.from(this.dependables.values()).reduce((count, services) => (
      count + (services.find(s => s.identifier === service.identifier) ? 1 : 0)
    ), 0);
    return weight + dependedByCount - dependsUponCount;
  }
}

export default Provisioner;
