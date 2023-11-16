import path from 'node:path'
import { createTerraformStack } from '@tests/e2e/createTerraformStack'
import { runTerraformTest } from '@tests/e2e/runTerraform'
import { getAwsTestsConfig } from '@tests/e2e/getAwsTestsConfig'
import type { ServiceConfiguration } from '@services/registry'

const testsConfig = getAwsTestsConfig(path.basename(__filename))

export const config: ServiceConfiguration[] = [
  {
    name: 'aws-provider',
    provider: 'aws',
    type: 'provider',
    region: testsConfig.region,
  },
  {
    name: 'aws-state',
    type: 'state',
    provider: 'aws',
    region: testsConfig.region,
    bucket: testsConfig.bucket,
    lockTable: testsConfig.lock,
    statePath: testsConfig.key,
  },
  {
    name: 'aws-networking',
    provider: 'aws',
    type: 'networking',
    region: testsConfig.region,
  },
  {
    name: 'aws-secrets',
    provider: 'aws',
    type: 'secrets',
    region: testsConfig.region,
  },
  {
    name: 'aws-db',
    provider: 'aws',
    type: 'mysql',
    region: testsConfig.region,
  },
]

describe('AWS databases deployment', () => {
  const output = path.dirname(__filename)

  beforeAll(() => {
    createTerraformStack(config, 'deploy-aws-databases', output)
  })

  it('deploys all resources properly', async () => {
    await runTerraformTest(output)
  })
})
