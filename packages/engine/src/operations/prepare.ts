import Operation from '@stackmate/engine/core/operation';
import { SERVICE_TYPE } from '@stackmate/engine/constants';

class PrepareOperation extends Operation {
  /**
   * Registers the services in the provisioner
   */
  registerServices() {
    this.provisioner.services = this.services.map(
      srv => srv.type === SERVICE_TYPE.STATE ? srv.scope('preparable') : srv.scope('deployable'),
    );
  }
}

export default PrepareOperation;
