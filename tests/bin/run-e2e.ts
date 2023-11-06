import path, { join, resolve } from 'node:path'
import fs, { readdirSync, readFileSync, statSync } from 'node:fs'

const CFG_NAME = 'config.json'
const PATH = resolve(__dirname, '..', '..', 'e2e')
const directories = readdirSync(PATH).filter((file) => statSync(join(PATH, file)))

import { Operation } from '@src/operation'
import type { ServiceConfiguration } from '@src/services/registry'

export const runTest = (
  directory: string,
  config: ServiceConfiguration[],
  filename = 'stackmate.tf.json',
) => {
  const operation = new Operation(config, 'e2e-test')
  const output = path.join(directory, filename)
  fs.writeFileSync(output, JSON.stringify(operation.process(), null, 2))
}

const process = () => {
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

process()
