import 'cdktf/lib/testing/adapters/jest';
import { join as joinPaths } from 'path';

import Profile from '@stackmate/engine/core/profile';
import { APP_HOME_DIRECTORY, PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';
import { stateConfiguration as serviceConfig } from '@stackmate/engine-tests/fixtures/local';
import { State as LocalState } from '@stackmate/engine/providers/local';

describe('LocalState', () => {
  describe('instantiation', () => {
    let service: LocalState;

    beforeEach(() => {
      service = LocalState.factory(serviceConfig);
    });

    it('instantiates the service and assigns the attributes correctly', () => {
      const { name, stageName } = serviceConfig;

      expect(service.provider).toEqual(PROVIDER.LOCAL);
      expect(service.type).toEqual(SERVICE_TYPE.STATE);
      expect(service.name).toEqual(name);
      expect(service.region).toBeUndefined();
      expect(service.links).toEqual([]);
      expect(service.profile).toEqual(Profile.DEFAULT);
      expect(service.overrides).toEqual({});
      expect(service.stageName).toEqual(stageName);
      expect(service.identifier).toEqual(`${name}-${stageName}`.toLowerCase());
    });

    it('returns the attribute names', () => {
      expect(new Set(service.attributeNames)).toEqual(new Set([
        'profile', 'overrides', 'projectName', 'stageName',
        'name', 'region', 'links',
      ]));
    });
  });

  describe('path information', () => {
    let service: LocalState;

    beforeEach(() => {
      service = LocalState.factory(serviceConfig);
    });

    it('returns the file path to be used', () => {
      expect(service.path).toEqual(`${service.stageName.toLowerCase()}-initial.tfstate`);
    });

    it('returns the workspace directory to be used', () => {
      expect(service.workspaceDir).toEqual(
        joinPaths(APP_HOME_DIRECTORY, service.projectName.toLowerCase()),
      );
    });
  });
});
