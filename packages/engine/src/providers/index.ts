import { DEFAULT_REGION } from '@stackmate/engine/providers/aws/constants';
import { PROVIDER } from '@stackmate/engine/constants';

export * from './services';
export * as AttributeTypes from './attributes';

export const DEFAULT_REGIONS: Record<string, string> = {
  [PROVIDER.AWS]: DEFAULT_REGION,
} as const;
