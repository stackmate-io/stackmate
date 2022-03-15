import { pick } from 'lodash';
import { Memoize } from 'typescript-memoize';

import Operation from '@stackmate/engine/core/operation';
import ServicesRegistry from '@stackmate/engine/core/registry';
import { CloudService } from '@stackmate/engine/interfaces';
import { PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';

class PrepareOperation extends Operation {
  /**
   * @returns {CloudService} the local state service
   */
  @Memoize() get localState(): CloudService {
    const attrs = { type: SERVICE_TYPE.STATE, provider: PROVIDER.LOCAL };
    return ServicesRegistry.get(pick(attrs, 'type', 'provider')).factory(attrs);
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
