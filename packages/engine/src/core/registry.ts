import { CloudService } from '@stackmate/interfaces';

/**
 * Service registry. Handles Services being added to the stack
 */
class Registry {
  /**
   * @var {Map} collection the list of available services
   * @private
   */
  private collection: Map<string, CloudService> = new Map();

  /**
   * @var {Map} queue the list of services that are awaited to be
   *                   introduced and their corresponding links
   * @private
   */
  private queue: Map<string, Set<string>> = new Map();

  /**
   * Adds a new service to the queue
   *
   * When introducing (adding) a new service, besides adding it,
   * we should also take care of the linked services.
   *
   * So, for example if we have the following set of services:
   *
   *  - { name: "A", links: ["B", "C"] }
   *  - { name: "B", links: ["A", "C"] }
   *  - { name: "C", links: ["A", "B"] }
   *
   * The following should take place:
   *
   *  - Service named "A" gets added to the collection first.
   *    It should get linked to "B" and "C" when they get added
   *
   *  - Service named "B" gets added to the collection second.
   *    It should get linked to "A" immediately (as it already exists in the collection)
   *    and get linked to service named "C" when it gets added
   *
   *  - Service named "C" gets added to the collection
   *    It should get linked to "A" and "B" immediately (as they are already in the collection)
   *
   * @param {Service} service the service to be added
   * @void
   */
  add(service: CloudService): void {
    // Add the list to the registry
    this.collection.set(service.name, service);

    if (service.links) {
      service.links.forEach((linkedServiceName: string) => {
        // if the linked service exists in the registry, just link the two
        if (this.collection.has(linkedServiceName)) {
          this.link(service.name, linkedServiceName);
        } else {
          // add to queue which means that when the linked service will be introduced,
          // it will be linked to the current one.
          this.enqueue(linkedServiceName, service.name);
        }
      });
    }

    // We should now dequeue (and link) any services that are awaiting the current service
    this.dequeue(service.name);
  }

  /**
   * Returns a service from the collection
   *
   * @param {string} serviceName the service name to look up
   * @throws {Error} when the service is not available in the collection
   * @returns {Service} the service requested
   */
  get(serviceName: string): CloudService {
    const service = this.collection.get(serviceName);

    if (!service) {
      throw new Error(`Service ${serviceName} was not found in the registry`);
    }

    return service;
  }

  /**
   * Adds a service to the queue so that when it becomes available, it gets linked to the set
   * of services that were previously waiting for it to be introduced.
   *
   * @param {String} awaitedServiceName the name of the service that we're awaiting to be introduced
   * @param {String} linkedServiceName the name of the service to be linked to when introduced
   * @void
   */
  enqueue(awaitedServiceName: string, linkedServiceName: string): void {
    const servicesToBeNotified = this.queue.get(awaitedServiceName) || new Set();

    servicesToBeNotified.add(linkedServiceName);

    this.queue.set(awaitedServiceName, servicesToBeNotified);
  }

  /**
   * Removes a service from the queue of the awaited ones
   *
   * @param {String} serviceName the service to be dequeued
   * @void
   */
  dequeue(serviceName: string): void {
    const linkedServices = this.queue.get(serviceName);
    this.queue.delete(serviceName);

    if (!linkedServices || !linkedServices.size) {
      return;
    }

    linkedServices.forEach(
      (name) => this.link(serviceName, name),
    );
  }

  /**
   * Links two services together
   *
   * @param {String} serviceName the service name to link
   * @param {String} linkedServiceName the target service to link the previous service to
   */
  link(serviceName: string, linkedServiceName: string): void {
    const source = this.get(serviceName);
    const target = this.get(linkedServiceName);

    source.link(target);
  }
}

export default Registry;
