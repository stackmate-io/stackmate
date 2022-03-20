import { pick } from 'lodash';
import { Memoize } from 'typescript-memoize';

import Operation from '@stackmate/engine/core/operation';
import Provisioner from '@stackmate/engine/core/provisioner';
import ServicesRegistry from '@stackmate/engine/core/registry';
import { PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';
import { CloudService, PrepareOperationOptions } from '@stackmate/engine/types';

class PrepareOperation extends Operation {
  /**
   * @var {Object} options any additional options for the operation
   */
  options: PrepareOperationOptions = {};

  /**
   * @returns {CloudService} the local state service
   */
  @Memoize() get localState(): CloudService {
    const { statePath } = this.options;
    const attrs = { type: SERVICE_TYPE.STATE, provider: PROVIDER.LOCAL, directory: statePath };
    return ServicesRegistry.get(pick(attrs, 'type', 'provider')).factory(attrs);
  }

  /**
   * @returns {Provisioner} the provisioner to use
   */
  @Memoize() get provisioner(): Provisioner {
    const provisioner = new Provisioner(
      this.project.name, this.stageName, this.options.outputPath,
    );

    provisioner.services = [
      this.localState.scope('deployable'),
      ...this.services.map(srv => srv.scope('preparable')),
    ];

    return provisioner;
  }
}

export default PrepareOperation;
