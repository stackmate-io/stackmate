import Operation from '@stackmate/engine/core/operation';

class DestroyOperation extends Operation {
  /**
   * Registers the services in the provisioner
   */
  registerServices() {
    this.provisioner.services = this.services.map(srv => srv.scope('destroyable'));
  }
}

export default DestroyOperation;
