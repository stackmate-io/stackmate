import fs from 'node:fs'
import path from 'node:path'
import { getProfile } from '@services/utils'
import { DEFAULT_PROFILE_NAME, PROVIDER, SERVICE_TYPE } from '@src/constants'

describe('getProfile', () => {
  const config = {
    provider: PROVIDER.AWS,
    type: SERVICE_TYPE.MYSQL,
    profile: DEFAULT_PROFILE_NAME,
    overrides: {},
  }

  it('raises an error for a missing service profile', () => {
    const existsMock = jest.spyOn(fs, 'existsSync').mockReturnValue(false)
    const profilePath = path.resolve(
      __dirname,
      '..',
      '..',
      '..',
      ...'src/services/providers/aws/profiles/database/default.ts'.split('/'),
    )

    expect(() => getProfile(config)).toThrow(`Profile file ${profilePath} does not exist`)

    expect(existsMock).toHaveBeenCalledWith(profilePath)

    existsMock.mockRestore()
  })

  it('returns an existing profile for a given service', () => {
    const profile = getProfile(config)
    expect(Object.keys(profile)).toEqual(expect.arrayContaining(['instance', 'params']))
  })

  it('applies overrides to the profile', () => {
    const fakeStorageType = 'test-specific-storage-type'
    const profile = getProfile({
      ...config,
      overrides: {
        instance: {
          storageType: fakeStorageType,
        },
      },
    })

    expect(Object.keys(profile)).toEqual(expect.arrayContaining(['instance', 'params']))
    expect(profile.instance.storageType).toEqual(fakeStorageType)
  })
})
