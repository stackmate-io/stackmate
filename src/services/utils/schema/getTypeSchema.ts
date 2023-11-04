import type { JsonSchema } from '@lib/schema'
import type { ServiceTypeChoice } from 'src/services/types'

/**
 * @param {ServiceTypeChoice[]} types the service types available
 * @param {ServiceTypeChoice} defaultType the default type for the service
 * @returns {JsonSchema} the service's type schema
 */
export const getTypeSchema = (types: ServiceTypeChoice[]): JsonSchema<ServiceTypeChoice> => ({
  type: 'string',
  enum: types,
  errorMessage: {
    enum: `You have to specify a valid service type, available are: ${types.join(', ')}`,
  },
})
