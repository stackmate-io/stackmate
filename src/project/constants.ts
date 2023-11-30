import { PROVIDER } from '@src/constants'

export const DEFAULT_PROVIDER = PROVIDER.AWS

export const DEFAULT_REGION = {
  [PROVIDER.AWS]: 'eu-central-1',
  [PROVIDER.LOCAL]: '',
} as const

export const ENVIRONMENT = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  STAGING: 'staging',
} as const
