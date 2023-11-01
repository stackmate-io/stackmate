import { faker } from '@faker-js/faker'

import { REGIONS } from '@providers/aws/constants'
import type { JsonSchema } from '@core/schema'
import { validateProject } from '@core/validation'
import type { BaseServiceAttributes } from '@core/service'
import { isCoreService } from '@core/service'
import { JSON_SCHEMA_ROOT, PROVIDER, CORE_SERVICE_TYPES, SERVICE_TYPE } from '@constants'
import type { CloudServiceConfiguration, Project, ProjectConfiguration } from '@core/project'
import { getProjectSchema, getProjectServices } from '@core/project'

describe('Project', () => {
  const [region] = REGIONS
  const provider = PROVIDER.AWS

  const servicesConfig: CloudServiceConfiguration[] = [
    { name: 'my-mysql-database', type: SERVICE_TYPE.MYSQL, provider, region },
    { name: 'my-postgresql-service', type: SERVICE_TYPE.POSTGRESQL, provider, region },
    { name: 'my-mariadb-service', type: SERVICE_TYPE.MARIADB, provider, region },
  ]

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
    services: servicesConfig,
  }

  const project: Project = validateProject(projectConfig)
  const services = project.services || []
  expect(services).toHaveLength(servicesConfig.length)

  describe('get project services', () => {
    const configs: BaseServiceAttributes[] = getProjectServices(project)

    it('returns all cloud configurations for the project', () => {
      const cloudServices = configs.filter(
        (c) => !isCoreService(c.type) && c.type !== SERVICE_TYPE.PROVIDER,
      )

      expect(Array.isArray(cloudServices)).toBe(true)
      expect(cloudServices).toHaveLength(services.length)
      expect(new Set(cloudServices.map((s) => s.name))).toEqual(
        new Set(services.map((s) => s.name)),
      )
    })

    it('returns all core services associated with the project', () => {
      const coreServices = configs.filter((c) => isCoreService(c.type))
      expect(new Set(coreServices.map((s) => s.type))).toEqual(new Set(CORE_SERVICE_TYPES))
    })

    it('populates and returns all providers for the project', () => {
      const providerServices = configs.filter((c) => c.type === SERVICE_TYPE.PROVIDER)
      expect(Array.isArray(providerServices)).toBe(true)
      // The AWS provider would be the only one available
      expect(providerServices).toHaveLength(1)
      expect(new Set(providerServices.map((p) => p.type))).toEqual(new Set([SERVICE_TYPE.PROVIDER]))
      expect(new Set(providerServices.map((p) => p.provider))).toEqual(new Set([PROVIDER.AWS]))
    })
  })

  describe('getProjectSchema', () => {
    it('returns a valid project schema', () => {
      const schema = getProjectSchema()
      const expectedSchema: JsonSchema<Project> = {
        $id: JSON_SCHEMA_ROOT,
        type: 'object',
        required: ['name', 'provider', 'region', 'services'],
        $defs: {},
        properties: {
          name: { type: 'string' },
          provider: { type: 'string' },
          region: { type: 'string' },
          secrets: { type: 'object' },
          state: { type: 'object' },
          services: {
            type: 'array',
            items: { type: 'object', required: ['name', 'type'] },
          },
        },
      }

      expect(schema).toMatchObject(expectedSchema)
    })
  })
})
