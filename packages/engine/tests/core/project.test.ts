import { cloneDeep } from 'lodash';
import { deepEqual } from 'assert';
import {
  BaseService, ProjectConfiguration, PROVIDER, SERVICE_TYPE, StackmateProject,
} from '@stackmate/engine';
import Project from '@stackmate/engine/core/project';

const projectFixture: ProjectConfiguration = {
  name: 'some-project',
  provider: 'aws',
  region: 'eu-central-1',
  state: {
    bucket: 'abc-defg',
  },
  stages: [{
    name: 'production',
    services: [{
      type: 'mysql',
      name: 'mydatabase',
      database: 'mysqldb',
    }],
  }],
};


describe('Project', () => {
  describe('validate', () => {
    it('validates a correct configuration', () => {
      expect(() => Project.validate(projectFixture, { useDefaults: false })).not.toThrow();
    });

    it('leaves the state of a valid configuration intact', () => {
      const source = cloneDeep(projectFixture);
      Project.validate(projectFixture, { useDefaults: false });
      expect(() => deepEqual(source, projectFixture)).not.toThrow();
    });
  });

  describe('stage population', () => {
    let services: BaseService.Type[];

    beforeAll(() => {
      services = Project.factory<StackmateProject.Type>(projectFixture).stage('production');
    });

    it('should feature a provider service for AWS', () => (
      expect(services.filter(
        srv => srv.type === SERVICE_TYPE.PROVIDER && srv.provider === PROVIDER.AWS,
      )).not.toBeNull()
    ));

    it('should feature a state service', () => (
      expect(services.filter(
        srv => srv.type === SERVICE_TYPE.STATE && srv.provider === PROVIDER.AWS,
      )).not.toBeNull()
    ));

    it('should feature a vault service', () => (
      expect(services.filter(
        srv => srv.type === SERVICE_TYPE.VAULT && srv.provider === PROVIDER.AWS,
      )).not.toBeNull()
    ));

    it('should feature a mysql service, according to the fixture', () => (
      expect(services.filter(
        srv => srv.type === SERVICE_TYPE.MYSQL && srv.provider === PROVIDER.AWS,
      )).not.toBeNull()
    ));
  });
});
