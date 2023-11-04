import type { JsonSchema } from '@lib/schema'
import type { ProviderChoice } from '@services/types'

/**
 * @param {ProviderChoice[]} providers the providers to allow in the schema
 * @param {ProviderChoice} defaultProvider the default provider for the service
 * @returns {JsonSchema} the provider's schema
 */

export const getProviderSchema = (
  providers: ProviderChoice[],
  defaultProvider?: ProviderChoice,
): JsonSchema<ProviderChoice> => ({
  type: 'string',
  enum: providers,
  default: defaultProvider,
  errorMessage: {
    enum: `The provider is invalid, available choices are: ${providers.join(', ')}`,
  },
})
