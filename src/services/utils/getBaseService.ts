import { getServiceNameSchema } from '@src/validation/utils/getServiceNameSchema'
import { kebabCase } from 'lodash'
import type { JsonSchema } from '@lib/schema'
import type {
  ProviderChoice,
  ServiceTypeChoice,
  Service,
  BaseServiceAttributes,
} from '@services/types'

/**
 * Returns a base core service (one that cannot be part of the services list)
 *
 * @param provider {ProviderChoice} the provider for the core service
 * @param type {ServiceTypeChoice} the service type for the core service
 * @returns {Service<Obj>} the core service
 */
export const getBaseService = (
  provider: ProviderChoice,
  type: ServiceTypeChoice,
): Service<BaseServiceAttributes & { provider: typeof provider; type: typeof type }> => {
  const schemaId = kebabCase(`services_${provider}_${type}`)
  const schema: JsonSchema<BaseServiceAttributes> = {
    $id: schemaId,
    type: 'object',
    required: ['name', 'type', 'provider'],
    additionalProperties: false,
    properties: {
      provider: { const: provider },
      type: { const: type },
      region: { type: 'string' },
      name: getServiceNameSchema(),
    },
  }

  return {
    provider,
    type,
    schema,
    schemaId,
    environment: [],
    associations: {},
    handler: () => {
      throw new Error('You have to register a handler for the service')
    },
  }
}
