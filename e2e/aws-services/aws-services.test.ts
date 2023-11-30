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

  describe('preview aws services deployment', () => {
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
      expect(logs.some((line) => line.match(/Plan: 7 to add, 1 to change, 0 to destroy/))).toBe(
        true,
      )

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
  })
})
