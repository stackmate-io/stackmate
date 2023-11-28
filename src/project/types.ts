import type { AwsStateAttributes } from '@src/services/providers/aws/services/state'
import type { LocalStateAttributes } from '@src/services/providers/local/services/state'
import type { ServiceConfiguration } from '@src/services/registry'
import type { ProviderChoice } from '@src/services/types'
import type { OptionalKeys } from '..'

export type Environment = Record<
  string,
  Record<string, OptionalKeys<ServiceConfiguration, 'provider' | 'name'>>
>

export type Project = {
  provider?: ProviderChoice
  region?: string
  state: AwsStateAttributes | LocalStateAttributes
  domains: Record<string, string[]>
  environments: Environment
}
