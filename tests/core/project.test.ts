import { faker } from '@faker-js/faker';
import { sortBy } from 'lodash';

import { REGIONS } from '@providers/aws/constants';
import { JsonSchema } from '@core/schema';
import { validateProject } from '@core/validation';
import { BaseServiceAttributes, isCoreService } from '@core/service';
import { JSON_SCHEMA_ROOT, PROVIDER, CORE_SERVICE_TYPES, SERVICE_TYPE } from '@constants';
import {
  CloudServiceConfiguration, getCloudServices, getProjectSchema,
  getServiceConfigurations, Project, ProjectConfiguration, withLocalState,
} from '@core/project';

describe('Project', () => {
  const [region] = REGIONS;
  const provider = PROVIDER.AWS;

  const servicesConfig: CloudServiceConfiguration<true>[] = [
    { name: 'my-mysql-database', type: SERVICE_TYPE.MYSQL, provider, region },
    { name: 'my-postgresql-service', type: SERVICE_TYPE.POSTGRESQL, provider, region },
    { name: 'my-mariadb-service', type: SERVICE_TYPE.MARIADB, provider, region },
  ];

  const projectConfig: ProjectConfiguration = {
    name: 'my-super-fun-project',
    provider,
    region,
    secrets: {
      provider: 'aws',
      region,
    },
    monitoring: {
      emails: [faker.internet.email()],
    },
    state: {
      provider: 'aws',
      bucket: 'my-aws-bucket',
      region,
    },
    stages: [{
      name: 'production',
      services: servicesConfig,
    }, {
      name: 'production-clone',
      copy: 'production',
    }, {
      name: 'without-postgresql',
      copy: 'production',
      skip: ['my-postgresql-service'],
    }, {
      name: 'without-postgres-or-mariadb',
      copy: 'production',
      skip: ['my-postgresql-service', 'my-mariadb-service'],
    }],
  };

  const project: Project = validateProject(projectConfig);
  const services = project.stages[0].services || [];
  expect(services).toHaveLength(servicesConfig.length);

  describe('getCloudServices', () => {
    it('extracts all cloud services assigned in the production stage', () => {
      const cloudServices = getCloudServices(project, 'production');
      expect(Array.isArray(services)).toBe(true);
      expect(cloudServices.length).toEqual(services.length)
      expect(sortBy(cloudServices, 'name')).toEqual(sortBy(services, 'name'));
    });

    it('extracts all cloud for a stage which is an exact clone of the production one', () => {
      const production = getCloudServices(project, 'production');
      const cloned = getCloudServices(project, 'production-clone');
      expect(Array.isArray(cloned)).toBe(true);
      expect(cloned.length).toEqual(production.length);
      expect(sortBy(cloned, 'name')).toEqual(sortBy(production, 'name'));
    });

    it('extracts all production cloud services without postgresql when it is marked as skipped',
      () => {
        const production = getCloudServices(project, 'production');
        const withoutPostgres = getCloudServices(project, 'without-postgresql');
        expect(Array.isArray(withoutPostgres)).toBe(true);
        expect(withoutPostgres.length).toEqual(production.length - 1);
        expect(sortBy(withoutPostgres, 'name')).toEqual(
          sortBy(production.filter(s => s.name !== 'my-postgresql-service'), 'name'),
        );
      });

    it('extracts all production cloud services minus the ones specified - more than one', () => {
      const production = getCloudServices(project, 'production');
      const withoutDbs = getCloudServices(project, 'without-postgres-or-mariadb');
      expect(Array.isArray(withoutDbs)).toBe(true);
      const excluded = ['my-postgresql-service', 'my-mariadb-service'];
      expect(withoutDbs.length).toEqual(production.length - excluded.length);
      expect(sortBy(withoutDbs, 'name')).toEqual(
        sortBy(production.filter(s => !excluded.includes(s.name)), 'name'),
      );
    });
  });

  describe('getServiceConfigurations', () => {
    const configs: BaseServiceAttributes[] = getServiceConfigurations('production')(project);

    it('returns all cloud configurations for the project', () => {
      const cloudServices = configs.filter(
        c => !isCoreService(c.type) && c.type !== SERVICE_TYPE.PROVIDER
      );

      expect(Array.isArray(cloudServices)).toBe(true);
      expect(cloudServices.length).toEqual(services.length);
      expect(new Set(cloudServices.map(s => s.name))).toEqual(new Set(services.map(s => s.name)));
    });

    it('returns all core services associated with the project', () => {
      const coreServices = configs.filter(c => isCoreService(c.type));
      expect(new Set(coreServices.map(s => s.type))).toEqual(new Set(CORE_SERVICE_TYPES));
    });

    it('populates and returns all providers for the project', () => {
      const providerServices = configs.filter(c => c.type === SERVICE_TYPE.PROVIDER);
      expect(Array.isArray(providerServices)).toBe(true);
      // The AWS provider would be the only one available
      expect(providerServices.length).toEqual(1);
      expect(new Set(providerServices.map(p => p.type))).toEqual(new Set([SERVICE_TYPE.PROVIDER]));
      expect(new Set(providerServices.map(p => p.provider))).toEqual(new Set([PROVIDER.AWS]));
    });
  });

  describe('getProjectSchema', () => {
    it('returns a valid project schema', () => {
      const schema = getProjectSchema();
      const expectedSchema: JsonSchema<Project> = {
        $id: JSON_SCHEMA_ROOT,
        type: 'object',
        required: ['name', 'provider', 'region', 'stages'],
        $defs: {},
        properties: {
          name: { type: 'string' },
          provider: { type: 'string' },
          region: { type: 'string' },
          secrets: { type: 'object' },
          state: { type: 'object' },
          stages: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                copy: { type: 'string' },
                skip: { type: 'array', items: { type: 'string' } },
                services: {
                  type: 'array',
                  items: { type: 'object', required: ['name', 'type'] },
                },
              },
            },
          },
        },
      };

      expect(schema).toMatchObject(expectedSchema);
    });
  });

  describe('withLocalState', () => {
    const configs: BaseServiceAttributes[] = getServiceConfigurations('production')(project);

    it('adds a local state & provider along with the AWS one', () => {
      const updated = withLocalState()(configs);
      expect(
        updated.find(s => s.type === SERVICE_TYPE.PROVIDER && s.provider === PROVIDER.AWS)
      ).not.toBeUndefined();
      expect(
        updated.find(s => s.type === SERVICE_TYPE.PROVIDER && s.provider === PROVIDER.LOCAL)
      ).not.toBeUndefined();
      expect(
        updated.find(s => s.type === SERVICE_TYPE.STATE && s.provider === PROVIDER.AWS)
      ).not.toBeUndefined();
      expect(
        updated.find(s => s.type === SERVICE_TYPE.STATE && s.provider === PROVIDER.LOCAL)
      ).not.toBeUndefined();
    });
  });
});
