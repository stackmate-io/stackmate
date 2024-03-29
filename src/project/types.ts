import type { AwsStateAttributes } from '@src/services/providers/aws/services/state'
import type { LocalStateAttributes } from '@src/services/providers/local/services/state'
import type { ServiceConfiguration } from '@src/services/registry'
import type { ProviderChoice } from '@src/services/types'
import type {
  ChoiceOf,
  DistributiveOmit,
  DistributiveOptionalKeys,
  OneOfType,
  OptionalKeys,
} from '@lib/util'
import type { ENVIRONMENT } from '@src/project/constants'

export type EnvironmentChoice = ChoiceOf<typeof ENVIRONMENT>

export type EnvironmentConfiguration = Partial<
  Record<EnvironmentChoice, Record<string, OptionalKeys<ServiceConfiguration, 'provider' | 'name'>>>
>

export type ProjectConfiguration = {
  name?: string
  provider?: ProviderChoice
  region?: string
  state: DistributiveOptionalKeys<
    DistributiveOmit<OneOfType<[AwsStateAttributes, LocalStateAttributes]>, 'name' | 'type'>,
    'provider' | 'region'
  >
  environments: EnvironmentConfiguration
}
