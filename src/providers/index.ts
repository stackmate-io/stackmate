import { PROVIDER } from '@constants'
import { DEFAULT_REGION } from '@providers/aws/constants'

export * from './services'

export const DEFAULT_REGIONS: Record<string, string> = {
  [PROVIDER.AWS]: DEFAULT_REGION,
} as const
