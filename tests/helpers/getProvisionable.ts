import { ProvisionablesMap } from '@src/operation/provisionables'
import type { ServiceConfiguration } from '@services/registry'

export const getProvisionable = (config: ServiceConfiguration) => {
  const mapping = new ProvisionablesMap()
  return mapping.create(config)
}
