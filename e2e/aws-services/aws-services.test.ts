import fs from 'node:fs'
import path from 'node:path'
import { cli } from '@bin/cli'

const configFile = path.resolve(__dirname, 'aws-services.yml')

describe('preview aws services deployment', () => {
  it('previews the changes to the stack', async () => {
    await cli.parse(['preview', 'production', '-c', configFile])

    const workingDir = path.join(__dirname, 'stacks', 'production')
    const stackFile = path.join(workingDir, 'main.tf.json')

    expect(fs.existsSync(stackFile)).toBe(true)
    expect(workingDir).toBeValidTerraform()
  })
})
