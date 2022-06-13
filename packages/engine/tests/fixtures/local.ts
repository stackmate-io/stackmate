import { tmpdir } from 'node:os';

import { PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';

export const stateConfiguration = {
  name: 'local-state',
  type: SERVICE_TYPE.STATE,
  provider: PROVIDER.LOCAL,
  directory: tmpdir(),
};
