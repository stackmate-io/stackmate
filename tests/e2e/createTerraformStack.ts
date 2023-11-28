import { Operation } from '@src/operation'
import { createJsonFile } from '@lib/file'
import type { ServiceConfiguration } from '@services/registry'

export const createTerraformStack = (
  config: ServiceConfiguration[],
  outputDirectory = __dirname,
  stackName = 'production',
) => {
  const operation = new Operation(config, stackName)
  createJsonFile(operation.process(), outputDirectory, 'main.tf.json')
}
