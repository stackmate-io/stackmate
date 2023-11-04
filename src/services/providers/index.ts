import { PROVIDER } from '@src/constants'
import { DEFAULT_REGION } from '@aws/constants'

export * from './services'

export const DEFAULT_REGIONS: Record<string, string> = {
  [PROVIDER.AWS]: DEFAULT_REGION,
} as const
