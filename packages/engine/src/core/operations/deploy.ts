import Operation from '@stackmate/core/operation';
import { CloudService } from '@stackmate/interfaces';

class DeployOperation extends Operation {
  protected get servicesInProvisioningOrder(): CloudService[] {
    return Array.from(this.services.values());
  }

  run(): void {
    this.clouds.forEach(cloud => {
      cloud.provision(this.stack);
    });

    /*
    this.servicesInProvisioningOrder.forEach(service => {
      const linkedServices = this.services;
      const cloud = this.clouds.get(service.provider);

      service.link([...cloud.prerequisites, ...linkedServices]);
      service.provision(this.stack, this.vault);
    });
    */
  }
}

export default DeployOperation;
