import { faker } from '@faker-js/faker/locale/af_ZA'
import { Operation } from '@src/operations'
import type { ServiceConfiguration } from '@services/registry'
import { createJsonFile } from './createJsonFile'

export const createTerraformStack = (
  config: ServiceConfiguration[],
  stackName = `${faker.internet.domainName}/${faker.helpers.arrayElement([
    'production',
    'staging',
  ])}`,
  outputDirectory = __dirname,
) => {
  const operation = new Operation(config, stackName)
  createJsonFile(operation.process(), outputDirectory, 'main.tf.json')
}
