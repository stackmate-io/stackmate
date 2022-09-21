import { DEFAULT_REGION } from '@stackmate/engine/providers/aws/constants';
import { PROVIDER } from '@stackmate/engine/constants';

export * from './services';

export const DEFAULT_REGIONS: Record<string, string> = {
  [PROVIDER.AWS]: DEFAULT_REGION,
};
