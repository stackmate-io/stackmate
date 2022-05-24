import { Memoize } from 'typescript-memoize';

import Operation from '@stackmate/engine/core/operation';
import Provisioner from '@stackmate/engine/core/provisioner';
import ServicesRegistry from '@stackmate/engine/core/registry';
import { PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';
import { BaseService, PrepareOperationOptions } from '@stackmate/engine/types';

class PrepareOperation extends Operation {
  /**
   * @var {Object} options any additional options for the operation
   */
  options: PrepareOperationOptions = {};

  /**
   * @returns {CloudService} the local state service
   */
  @Memoize() get localState(): BaseService.Type {
    const { statePath } = this.options;
    const attrs = { type: SERVICE_TYPE.STATE, provider: PROVIDER.LOCAL, directory: statePath };
    return ServicesRegistry.get(PROVIDER.LOCAL, SERVICE_TYPE.STATE).factory(attrs);
  }

  /**
   * @returns {Provisioner} the provisioner to use
   */
  @Memoize() get provisioner(): Provisioner {
    const provisioner = new Provisioner(
      this.project.name, this.stageName, this.options.outputPath,
    );

    const services = this.services.filter(
      srv => srv.type !== SERVICE_TYPE.STATE,
    ).map(
      srv => srv.scope('preparable'),
    );

    provisioner.services = [this.localState.scope('deployable'), ...services ];

    return provisioner;
  }
}

export default PrepareOperation;
