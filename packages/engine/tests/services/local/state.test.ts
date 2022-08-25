import 'cdktf/lib/testing/adapters/jest';

import { stateConfiguration as serviceConfig } from 'tests/engine/fixtures/local';
import { State as LocalState } from '@stackmate/engine/providers/local';
import { projectName, stageName } from 'tests/engine/fixtures/generic';
import { DEFAULT_PROFILE_NAME, PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';

describe('LocalState', () => {
  describe('instantiation', () => {
    let service: LocalState;

    beforeEach(() => {
      service = LocalState.factory<LocalState>(serviceConfig, projectName, stageName);
    });

    it('instantiates the service and assigns the attributes correctly', () => {
      const { name } = serviceConfig;

      expect(service.provider).toEqual(PROVIDER.LOCAL);
      expect(service.type).toEqual(SERVICE_TYPE.STATE);
      expect(service.name).toEqual(name);
      expect(service.links).toEqual([]);
      expect(service.profile).toEqual(DEFAULT_PROFILE_NAME);
      expect(service.overrides).toEqual({});
      expect(service.stageName).toEqual(stageName);
      expect(service.identifier).toEqual(`${name}-${stageName}`.toLowerCase());
    });
  });

  describe('path information', () => {
    let service: LocalState;

    beforeEach(() => {
      service = LocalState.factory<LocalState>(serviceConfig, projectName, stageName);
    });

    it('returns the file path to be used', () => {
      expect(service.path).toEqual(`${service.stageName.toLowerCase()}-initial.tfstate`);
    });
  });
});
