/* eslint-disable no-console */
import { spawn } from 'node:child_process'
import { isEmpty } from 'lodash'

const TF_PATH = process.env.TERRAFORM_CLI_PATH || '/usr/local/bin/terraform'

const execute = async (
  command: string[],
  cwd: string,
): Promise<{ code: number; errors?: string[]; output: string }> =>
  new Promise((resolve, reject) => {
    const [executable, ...args] = command
    const child = spawn(executable, args, { cwd })

    let output = ''
    child.stdout.setEncoding('utf8')
    child.stdout.on('data', (data) => {
      output += data.toString()
      console.log(data.toString())
    })

    let errorOutput = ''
    const errors: string[] = []
    child.stderr.setEncoding('utf8')
    child.stderr.on('data', function (data) {
      errorOutput += data.toString()
      errors.push(data.toString())
    })

    child.on('close', (code) => {
      if (code === 0 && isEmpty(errors)) {
        return resolve({ code, output })
      }

      return reject({ code, errors, output: errorOutput })
    })
  })

export const runTerraformTest = async (directory: string, terraformPath: string = TF_PATH) => {
  await execute([terraformPath, 'init', '-migrate-state'], directory)
  await execute([terraformPath, 'test', '-verbose'], directory)
}
