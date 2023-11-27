import { ProvisionablesMap } from '@src/operation/utils/provisionables'
import type { ServiceConfiguration } from '@services/registry'

export const getProvisionable = (config: ServiceConfiguration) => {
  const mapping = new ProvisionablesMap()
  return mapping.create(config)
}
