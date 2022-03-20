import { Memoize } from 'typescript-memoize';

import Operation from '@stackmate/engine/core/operation';
import Provisioner from '@stackmate/engine/core/provisioner';

class DeployOperation extends Operation {
  /**
   * @returns {Provisioner} the provisioner to use
   */
  @Memoize() get provisioner(): Provisioner {
    const provisioner = new Provisioner(
      this.project.name, this.stageName, this.options.outputPath,
    );

    provisioner.services = this.services.map(srv => srv.scope('deployable'));

    return provisioner;
  }
}

export default DeployOperation;
