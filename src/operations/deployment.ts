import type { Dictionary } from 'lodash'
import type { ServiceConfiguration } from '@src/services/registry'
import { Operation } from './utils/operation'

export const deployment = (
  configs: ServiceConfiguration[],
  envName: string,
  variables: Dictionary<string | undefined> = process.env,
) => {
  const operation = new Operation(configs, envName, variables)
  return operation.process()
}
