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
      output += data
      console.log(data)
    })

    let errorOutput = ''
    const errors: string[] = []
    child.stderr.setEncoding('utf8')
    child.stderr.on('data', function (data) {
      errorOutput += data
      errors.push(String(data))
    })

    child.on('close', (code) => {
      if (code === 0 && isEmpty(errors)) {
        return resolve({ code, output })
      }

      return reject({ code, errors, output: errorOutput })
    })
  })

export const runTerraform = async (directory: string, terraformPath: string = TF_PATH) => {
  try {
    console.info('Initializing terraform inside', directory)
    await execute([terraformPath, 'init'], directory)

    console.info('Running terraform inside', directory)
    await execute([terraformPath, 'test', '-verbose', directory], directory)
  } catch (err) {
    console.error('Error while executing terraform')
    console.error(err)
  }
}
