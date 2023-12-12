import { ProvisionablesMap } from '@src/operation/provisionables'
import type { BaseProvisionable } from '@src/services/types'

export const getProvisionable = <P extends BaseProvisionable>(
  config: P['config'],
  requirements: P['requirements'] | null = null,
) => {
  const mapping = new ProvisionablesMap()
  const provisionable = mapping.create(config)
  return { ...provisionable, requirements: { ...provisionable.requirements, ...requirements } }
}
