import { PROVIDER, SERVICE_TYPE } from '@stackmate/constants';
import { projectName, stageName } from 'tests/fixtures/generic';

export const stateConfiguration = {
  name: 'local-state',
  type: SERVICE_TYPE.STATE,
  provider: PROVIDER.LOCAL,
  projectName,
  stageName,
};
