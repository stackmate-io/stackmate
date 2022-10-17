import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';

import { getProfilePath, getServiceProfile } from '@stackmate/engine/core/profile';
import { PROFILES_PATH, PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';

describe('getProfilePath', () => {
  it('returns the path for a profile for a service without overrides', () => {
    const p = getProfilePath(
      PROVIDER.AWS, SERVICE_TYPE.SECRETS, 'production', { withExtension: true },
    );

    expect(p).toEqual(
      path.join(PROFILES_PATH, PROVIDER.AWS, SERVICE_TYPE.SECRETS, 'production.ts'),
    );
  });

  it('returns the path for a profile for a service without overrides', () => {
    const p = getProfilePath(
      PROVIDER.AWS, SERVICE_TYPE.MYSQL, 'production', { withExtension: true },
    );

    expect(p).toEqual(path.join(PROFILES_PATH, PROVIDER.AWS, 'database', 'production.ts'));
  });

  it('returns the path for a profile with the file extension', () => {
    const p = getProfilePath(
      PROVIDER.AWS, SERVICE_TYPE.SECRETS, 'production', { withExtension: true },
    );

    expect(p).toEqual(
      path.join(PROFILES_PATH, PROVIDER.AWS, SERVICE_TYPE.SECRETS, 'production.ts'),
    );
  });
});

describe('getServiceProfile', () => {
  const existingProfile = 'production';
  const missingProfile = 'this-profile-does-not-exist';

  it('returns an existing profile for a given service', () => {
    const p = getProfilePath(
      PROVIDER.AWS, SERVICE_TYPE.MYSQL, existingProfile, { withExtension: true },
    );
    assert.equal(fs.existsSync(p), true);

    const profile = getServiceProfile(PROVIDER.AWS, SERVICE_TYPE.MYSQL, existingProfile);
    expect(Object.keys(profile)).toEqual(expect.arrayContaining(['instance', 'params']));
  });

  it('raises an error for a missing service profile', () => {
    const p = getProfilePath(
      PROVIDER.AWS, SERVICE_TYPE.MYSQL, missingProfile, { withExtension: true },
    );

    assert.equal(fs.existsSync(p), false);

    expect(
      () => getServiceProfile(PROVIDER.AWS, SERVICE_TYPE.MYSQL, missingProfile)
    ).toThrow(
      `The profile ${missingProfile} was not found in the system`
    );
  });
});
