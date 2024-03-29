import type { TerraformLocal } from 'cdktf'
import type { PROVIDER, SERVICE_TYPE } from '@src/constants'
import type { ChoiceOf } from '@lib/util'

export type ProviderChoice = ChoiceOf<typeof PROVIDER>
export type ServiceTypeChoice = ChoiceOf<typeof SERVICE_TYPE>

export type ServiceEnvironment<Vars extends string[] = []> = {
  [K in Vars[number]]: {
    required: boolean
    description?: string
  }
}

export type BaseServiceAttributes = {
  name: string
  provider: ProviderChoice
  type: ServiceTypeChoice
  region?: string
}

export type Credentials = {
  username: TerraformLocal
  password: TerraformLocal
}
