import path from 'node:path'
import { createTerraformStack } from '@tests/e2e/createTerraformStack'
import { runTerraformTest } from '@tests/e2e/runTerraform'
import { getAwsTestsConfig } from '@tests/e2e/getAwsTestsConfig'
import { faker } from '@faker-js/faker'
import type { ServiceConfiguration } from '@services/registry'

const testsConfig = getAwsTestsConfig(path.basename(__filename))

export const config: ServiceConfiguration[] = [
  {
    name: 'provider',
    provider: 'aws',
    type: 'provider',
    region: testsConfig.region,
  },
  {
    name: 'networking',
    provider: 'aws',
    type: 'networking',
    region: testsConfig.region,
  },
  {
    name: 'state',
    type: 'state',
    provider: 'aws',
    region: testsConfig.region,
    bucket: testsConfig.bucket,
    lockTable: testsConfig.lock,
    statePath: testsConfig.key,
  },
  {
    name: faker.internet.domainWord(),
    provider: 'aws',
    type: 'redis',
    region: testsConfig.region,
  },
]

describe('AWS Elasticache Redis instance deployment', () => {
  const output = path.dirname(__filename)

  beforeAll(() => {
    createTerraformStack(config, output)
  })

  it('deploys all resources properly', async () => {
    await runTerraformTest(output)
  })
})
