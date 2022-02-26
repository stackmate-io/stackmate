import { Memoize } from 'typescript-memoize';

import Operation from '@stackmate/core/operation';
import ServicesRegistry from '@stackmate/core/registry';
import { CloudService } from '@stackmate/interfaces';
import { PROVIDER, SERVICE_TYPE } from '@stackmate/constants';

class PrepareOperation extends Operation {
  /**
   * @returns {CloudService} the local state service
   */
  @Memoize() get localState(): CloudService {
    const state = ServicesRegistry.get({ type: SERVICE_TYPE.STATE, provider: PROVIDER.LOCAL });
    /** @todo set the attributes */
    return state.factory();
  }

  /**
   * Prepares the services for provisioning
   */
  run() {
    this.provisioner.services = [
      this.localState.scope('deployable'),
      ...this.services.map(srv => srv.scope('preparable')),
    ];

    this.provisioner.process();
  }
}

export default PrepareOperation;
