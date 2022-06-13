import Operation from '@stackmate/engine/core/operation';

class DeployOperation extends Operation {
  /**
   * Registers the services in the provisioner
   */
  registerServices() {
    this.provisioner.services = this.services.map(srv => srv.scope('deployable'));
  }
}

export default DeployOperation;
