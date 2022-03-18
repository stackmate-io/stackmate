import Operation from '@stackmate/engine/core/operation';

class DeployOperation extends Operation {
  /**
   * Runs the provisioning process
   */
  synthesize(): void {
    this.provisioner.services = this.services.map(srv => srv.scope('deployable'));
    this.provisioner.process();
  }
}

export default DeployOperation;
