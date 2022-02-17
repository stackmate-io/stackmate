import { Memoize } from 'typescript-memoize';

import Operation from '@stackmate/core/operation';
import { CloudService } from '@stackmate/interfaces';
import { ServicesRegistry } from '@stackmate/core/registry';
import { PROVIDER, SERVICE_TYPE } from '@stackmate/constants';

class PrepareOperation extends Operation {
  /**
   * @returns {CloudService} the local state service
   */
  @Memoize() get localState(): CloudService {
    const state = ServicesRegistry.get({ type: SERVICE_TYPE.STATE, provider: PROVIDER.FILE });
    return state.factory();
  }

  /**
   * Prepares the services for provisioning
   */
  run() {
    this.provisioner.add(this.localState.scope('provisionable'));

    this.services.forEach(srv => {
      this.provisioner.add(srv.scope('preparable'));
    });

    this.provisioner.process();
  }

}

export default PrepareOperation;
