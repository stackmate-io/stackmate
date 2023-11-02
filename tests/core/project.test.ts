import { REGIONS } from '@providers/aws/constants'
import { PROVIDER, SERVICE_TYPE } from '@constants'
import type { ServiceConfiguration } from 'src'

describe('Project', () => {
  const [region] = REGIONS
  const provider = PROVIDER.AWS
  const { MYSQL, POSTGRESQL, MARIADB, STATE } = SERVICE_TYPE

  const servicesConfig: ServiceConfiguration[] = [
    { name: 'my-mysql-database', type: MYSQL, provider, region },
    { name: 'my-postgresql-service', type: POSTGRESQL, provider, region },
    { name: 'my-mariadb-service', type: MARIADB, provider, region },
    { name: 'project-state', type: STATE, provider: 'aws', bucket: 'my-aws-bucket', region },
  ]

  // describe('getProjectSchema', () => {
  //   it('returns a valid project schema', () => {
  //     const schema = getProjectSchema()
  //     const expectedSchema: JsonSchema<Project> = {
  //       $id: JSON_SCHEMA_ROOT,
  //       type: 'object',
  //       required: ['name', 'provider', 'region', 'services'],
  //       $defs: {},
  //       properties: {
  //         name: { type: 'string' },
  //         provider: { type: 'string' },
  //         region: { type: 'string' },
  //         secrets: { type: 'object' },
  //         state: { type: 'object' },
  //         services: {
  //           type: 'array',
  //           items: { type: 'object', required: ['name', 'type'] },
  //         },
  //       },
  //     }

  //     expect(schema).toMatchObject(expectedSchema)
  //   })
  // })
})
