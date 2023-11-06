/* eslint-disable no-console */
import path, { join, resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { Operation } from '@src/operation'
import type { ServiceConfiguration } from '@src/services/registry'

const CFG_NAME = 'config.json'
const PATH = resolve(__dirname, '..', '..', 'e2e')
const directories = readdirSync(PATH).filter((file) => statSync(join(PATH, file)))
const TF_PATH = process.env.TF_PATH || '/usr/local/bin/terraform'

export const runTerraform = (directory: string) => {
  const child = spawn(TF_PATH, ['test', `-test-directory=${directory}`, '-verbose'])

  child.stdout.setEncoding('utf8')
  child.stdout.on('data', (data) => {
    console.log(data)
  })

  const errors: string[] = []
  child.stderr.setEncoding('utf8')
  child.stderr.on('data', function (data) {
    errors.push(String(data))
  })

  child.on('close', function (code) {
    if (errors) {
      console.error('Terraform test exited with code', code)
      console.error(errors.join('\n'))
    } else {
      console.log('Terraform test finished with code', code)
    }
  })
}

export const runTest = (
  directory: string,
  config: ServiceConfiguration[],
  filename = 'stackmate.tf.json',
) => {
  const operation = new Operation(config, 'e2e-test')
  const output = path.join(directory, filename)
  writeFileSync(output, JSON.stringify(operation.process(), null, 2))
  runTerraform(directory)
}

const runAllTests = () => {
  for (const dir of directories) {
    let config
    const fullDir = join(PATH, dir)
    const filename = join(fullDir, CFG_NAME)

    try {
      config = JSON.parse(readFileSync(filename, 'utf-8'))
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(`No ${CFG_NAME} is available under ${dir}. You need to provide that for testing`)
      continue
    }

    runTest(fullDir, config)
  }
}

runAllTests()
