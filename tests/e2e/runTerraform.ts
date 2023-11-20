/* eslint-disable no-console */
import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { isEmpty } from 'lodash'

const TF_PATH = process.env.TERRAFORM_CLI_PATH || '/usr/local/bin/terraform'
const TF_LOG = 'terraform.log'
const TEST_ENV = {
  NODE_ENV: 'test',
  AWS_PROFILE: 'engine-tests-local',
}

const execute = async (
  command: string[],
  cwd: string,
): Promise<{ code: number; errors?: string[] }> =>
  new Promise((resolve, reject) => {
    const [executable, ...args] = command
    const child = spawn(executable, args, { cwd, env: TEST_ENV })
    const logOutput = path.join(cwd, TF_LOG)

    child.stdout.setEncoding('utf8')
    child.stdout.on('data', (data) => {
      fs.writeFileSync(logOutput, data.string(), { flag: 'a' })
    })

    const errors: string[] = []
    child.stderr.setEncoding('utf8')
    child.stderr.on('data', function (data) {
      errors.push(data.toString())
    })

    child.on('close', (code) => {
      if (code === 0 && isEmpty(errors)) {
        return resolve({ code })
      }

      return reject({ code, errors })
    })
  })

export const runTerraformTest = async (directory: string, terraformPath: string = TF_PATH) => {
  await execute([terraformPath, 'init', '-migrate-state'], directory)
  await execute([terraformPath, 'test', '-verbose'], directory)
}
