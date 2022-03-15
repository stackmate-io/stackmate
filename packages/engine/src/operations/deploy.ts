import Operation from '@stackmate/engine/core/operation';

class DeployOperation extends Operation {
  /**
   * Runs the provisioning process
   */
  run() {
    this.provisioner.services = this.services.map(srv => srv.scope('deployable'));
    this.provisioner.process();
  }
}

export default DeployOperation;
