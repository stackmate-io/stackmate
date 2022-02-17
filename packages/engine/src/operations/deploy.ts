import Operation from '@stackmate/core/operation';

class DeployOperation extends Operation {
  /**
   * Runs the provisioning process
   */
  run() {
    this.services.forEach(srv => {
      this.provisioner.add(srv.scope('provisionable'));
    });

    this.provisioner.process();
  }
}

export default DeployOperation;
