/* eslint-disable no-console */
import path, { join, resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { readdirSync, statSync, writeFileSync } from 'node:fs'
import { isEmpty } from 'lodash'
import { Operation } from '@src/operation'
import type { ServiceConfiguration } from '@src/services/registry'

const CFG_NAME = 'config.ts'
const STACK_FILE = 'main.tf.json'
const PATH = resolve(__dirname, '..', '..', 'e2e')
const directories = readdirSync(PATH).filter((file) => statSync(join(PATH, file)))
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

export const runTerraform = async (directory: string) => {
  try {
    console.info('Initializing terraform inside', directory)
    await execute([TF_PATH, 'init'], directory)

    console.info('Running terraform inside', directory)
    await execute([TF_PATH, 'test', '-verbose', directory], directory)
  } catch (err) {
    console.error('Error while executing terraform')
    console.error(err)
  }
}

export const runTest = async (
  directory: string,
  config: ServiceConfiguration[],
  filename = STACK_FILE,
) => {
  const operation = new Operation(config, 'e2e-test')
  const output = path.join(directory, filename)
  writeFileSync(output, JSON.stringify(operation.process(), null, 2))
  await runTerraform(directory)
}

const runAllTests = async () => {
  for (const dir of directories) {
    let config
    const fullDir = join(PATH, dir)
    const filename = join(fullDir, CFG_NAME)

    try {
      // eslint-disable-next-line global-require,import/no-dynamic-require,@typescript-eslint/no-var-requires
      ;({ config } = require(filename))
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(`No ${CFG_NAME} is available under ${dir}. You need to provide that for testing`)
      if (err instanceof Error) {
        console.warn('Error thrown while requiring the file', err.message)
      }

      continue
    }

    await runTest(fullDir, config)
  }
}

runAllTests()
  .then(() => console.info('Ran end to end tests'))
  .catch((err) => console.error('End to end tests failed', err))
