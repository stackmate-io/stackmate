import { Operation } from '@src/operations'
import type { ServiceConfiguration } from '@services/registry'
import { createJsonFile } from './createJsonFile'

export const createTerraformStack = (
  config: ServiceConfiguration[],
  outputDirectory = __dirname,
  stackName = 'production',
) => {
  const operation = new Operation(config, stackName)
  createJsonFile(operation.process(), outputDirectory, 'main.tf.json')
}
