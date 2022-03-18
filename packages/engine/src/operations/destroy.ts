import Operation from '@stackmate/engine/core/operation';

class DestroyOperation extends Operation {
  /**
   * Runs the destroy process
   */
  synthesize(): void {
    this.provisioner.services = this.services.map(srv => srv.scope('destroyable'));
    this.provisioner.process();
  }
}

export default DestroyOperation;
