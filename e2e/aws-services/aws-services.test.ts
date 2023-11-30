import fs from 'node:fs'
import path from 'node:path'
import { cli } from '@bin/cli'
import * as tfOutputHandler from '@bin/utils/handleTerraformOutput'
import {
  dbInstance,
  dbSubnetGroup,
  elasticacheCluster,
  elasticacheSubnetGroup,
  internetGateway,
  kmsKey,
  vpc,
} from '@cdktf/provider-aws'
import type { LogMessage, ProjectUpdate } from '@cdktf/cli-core/src/lib/cdktf-project'

describe('AWS End To End Tests', () => {
  const configFile = path.resolve(__dirname, 'aws-services.yml')
  const workingDir = path.join(path.dirname(configFile), 'stacks', 'production')
  const stackFile = path.join(workingDir, 'main.tf.json')

  let logSpy: jest.SpyInstance
  let logs: string[] = []

  beforeEach(() => {
    logSpy = jest
      .spyOn(tfOutputHandler, 'handleTerraformOutput')
      .mockImplementation((log: ProjectUpdate | LogMessage) => {
        if ('message' in log) {
          logs.push(log.message)
        }
      })
  })

  afterEach(() => {
    logs = []
    logSpy.mockReset()
  })

  it('previews the changes to the stack', async () => {
    await cli.parse(['preview', 'production', '-c', configFile])

    expect(fs.existsSync(stackFile)).toBe(true)
    const stackContents = fs.readFileSync(stackFile, 'utf-8')

    // Should output the plan summary after successful plan
    const summaryLine = logs.find((line) =>
      line.match(
        /(Plan: \d+ to add, \d+ to change, \d+ to destroy.|No changes. Your infrastructure matches the configuration.)/,
      ),
    )
    expect(summaryLine).not.toBeUndefined()

    // Base Resources
    expect(stackContents).toHaveResource(vpc.Vpc)
    expect(stackContents).toHaveResource(kmsKey.KmsKey)
    expect(stackContents).toHaveResource(internetGateway.InternetGateway)

    // Db Resources
    expect(stackContents).toHaveResource(dbInstance.DbInstance)
    expect(stackContents).toHaveResource(dbSubnetGroup.DbSubnetGroup)

    // Cache Resources
    expect(stackContents).toHaveResource(elasticacheCluster.ElasticacheCluster)
    expect(stackContents).toHaveResource(elasticacheSubnetGroup.ElasticacheSubnetGroup)
  })

  it('deploys the stack', async () => {
    await cli.parse(['deploy', 'production', '-c', configFile])

    expect(fs.existsSync(stackFile)).toBe(true)

    const summaryLine = logs.find((line) =>
      line.match(/Apply complete! Resources: \d+ added, \d+ changed, 0 destroyed./),
    )
    expect(summaryLine).not.toBeUndefined()

    expect(
      logs.some((line) =>
        line.match(
          /aws_mysql_eu_central_1_1_endpoint\s=\s\"mysql-database-production.[a-z]+.eu-central-1.rds.amazonaws.com:3306\"/,
        ),
      ),
    ).toBe(true)
    expect(
      logs.some((line) => line.match(/aws_networking_eu_central_1_1_vpc_id\s=\s\"vpc-[a-z0-9]+\"/)),
    ).toBe(true)
    expect(
      logs.some((line) =>
        line.match(
          /aws_objectstore_eu_central_1_1_bucket_stackmate_tests_e_2_e_bucket_1_domain_name\s=\s\"stackmate-tests-e2e-bucket-1.s3.amazonaws.com\"/,
        ),
      ),
    ).toBe(true)
    expect(
      logs.some((line) =>
        line.match(
          /aws_objectstore_eu_central_1_1_bucket_stackmate_tests_e_2_e_bucket_1_regional_domain_name\s=\s\"stackmate-tests-e2e-bucket-1.s3.eu-central-1.amazonaws.com\"/,
        ),
      ),
    ).toBe(true)
    expect(
      logs.some((line) =>
        line.match(
          /aws_redis_eu_central_1_1_endpoint\s=\s\"redis-kv-production.[0-9a-z]+.0001.euc1.cache.amazonaws.com\"/,
        ),
      ),
    ).toBe(true)
  })

  it('destroys the stack', async () => {
    await cli.parse(['destroy', 'production', '-c', configFile])

    expect(fs.existsSync(stackFile)).toBe(true)

    const summaryLine = logs.find((line) =>
      line.match(/Destroy complete! Resources: \d+ destroyed./),
    )
    expect(summaryLine).not.toBeUndefined()
  })
})
