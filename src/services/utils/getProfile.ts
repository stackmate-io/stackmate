import { join } from 'node:path'
import { existsSync } from 'node:fs'
import { DEFAULT_PROFILE_NAME, SERVICE_TYPE } from '@src/constants'
import { isEmpty, merge } from 'lodash'
import type { BaseServiceAttributes, ServiceTypeChoice } from '@services/types'
import type { ProfilableAttributes } from '@services/behaviors'

type Args = Pick<BaseServiceAttributes, 'provider' | 'type'> & Partial<ProfilableAttributes>

const PROFILE_DIRECTORY_OVERRIDES: Map<ServiceTypeChoice, string> = new Map([
  [SERVICE_TYPE.MEMCACHED, 'cache'],
  [SERVICE_TYPE.REDIS, 'cache'],
  [SERVICE_TYPE.MARIADB, 'database'],
  [SERVICE_TYPE.MYSQL, 'database'],
  [SERVICE_TYPE.POSTGRESQL, 'database'],
])

export const getProfile = ({
  provider,
  type,
  profile = DEFAULT_PROFILE_NAME,
  overrides = {},
}: Args) => {
  const profilePath = join(
    __dirname,
    '..',
    'providers',
    provider,
    'profiles',
    PROFILE_DIRECTORY_OVERRIDES.get(type) || type,
    `${profile}.ts`,
  )

  if (!existsSync(profilePath)) {
    throw new Error(`Profile file ${profilePath} does not exist`)
  }

  let profileConfig = {}

  try {
    // eslint-disable-next-line global-require,import/no-dynamic-require
    profileConfig = require(profilePath)
  } catch (error) {
    throw new Error(`Failed to load profile ${profile} for ${provider} service ${type}`)
  }

  if (!isEmpty(overrides)) {
    profileConfig = merge({}, profileConfig, overrides)
  }

  return profileConfig
}
