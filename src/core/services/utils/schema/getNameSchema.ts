import type { JsonSchema } from '@lib/schema'
import type { BaseServiceAttributes } from '@services/types'

/**
 * @returns {JsonSchema} the service's name schema
 */

export const getNameSchema = (): JsonSchema<BaseServiceAttributes['name']> => ({
  type: 'string',
  pattern: '^([a-zA-Z0-9_-]+)$',
  minLength: 2,
  description: 'The name for the service to deploy',
  errorMessage: {
    minLength: 'The service’s name should be two characters or more',
    pattern:
      'The name property on the service should only contain characters, numbers, dashes and underscores',
  },
})
