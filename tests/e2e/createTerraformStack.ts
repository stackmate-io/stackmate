import { Operation } from '@src/operation'
import { writeJsonFile } from '@lib/file'
import type { ServiceConfiguration } from '@services/registry'

export const createTerraformStack = (
  config: ServiceConfiguration[],
  outputDirectory = __dirname,
  stackName = 'production',
) => {
  const operation = new Operation(config, stackName)
  writeJsonFile(operation.process(), outputDirectory, 'main.tf.json')
}
