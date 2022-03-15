import { PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';
import { projectName, stageName } from '@stackmate/engine-tests/fixtures/generic';

export const stateConfiguration = {
  name: 'local-state',
  type: SERVICE_TYPE.STATE,
  provider: PROVIDER.LOCAL,
  projectName,
  stageName,
};
