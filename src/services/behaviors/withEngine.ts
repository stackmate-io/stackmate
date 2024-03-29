import type { BaseServiceAttributes } from '@services/types'
import { withSchema } from './withSchema'

/**
 * @type {EngineAttributes} engine attributes
 */

export type EngineAttributes<T extends string = string> = { engine: T }
/**
 * Adds engine support to a service (eg. database or cache engine to run)
 *
 * @param {String} engine the engine for the service
 * @returns {Function<Service>}
 */

export const withEngine = <
  E extends string,
  C extends BaseServiceAttributes = BaseServiceAttributes,
>(
  engine: E,
  isRequired = false,
) =>
  withSchema<C, EngineAttributes>({
    type: 'object',
    required: isRequired ? ['engine'] : [],
    properties: {
      engine: {
        type: 'string',
        enum: [engine],
        default: engine,
        errorMessage: {
          enum: `The engine can only be ${engine}`,
        },
      },
    },
  })
