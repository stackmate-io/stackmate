import Operation from '@stackmate/core/operation';

class DestroyOperation extends Operation {
  /**
   * Runs the destroy process
   */
  run() {
    this.provisioner.services = this.services.map(srv => srv.scope('destroyable'));
    this.provisioner.process();
  }
}

export default DestroyOperation;
