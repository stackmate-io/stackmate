import pipe from 'lodash/fp/pipe'
import type { Service, BaseServiceAttributes } from '@services/types'
import { withProperties } from './withProperties'
import { withSchema } from './withSchema'

/**
 * @type {RegionalAttributes} region-specific attributes
 */
export type RegionalAttributes<T extends string = string> = { region: T }

/**
 * @type {AdditionalProps} the service additional properties
 */
type AdditionalProps = { regions: readonly string[] }

/**
 * Enhances a service to support regions
 * @param {string[]} regions the regions that the service can be provisioned in
 * @param {string} defaultRegion the default region to provision the service in
 * @returns {Function<Service>}
 */
export const withRegions =
  <C extends BaseServiceAttributes>(regions: string[] | readonly string[]) =>
  <T extends Service<C>>(srv: T): T & AdditionalProps =>
    pipe(
      withProperties<C, AdditionalProps>({ regions }),
      withSchema<C, RegionalAttributes>({
        type: 'object',
        required: ['region'],
        properties: {
          region: {
            type: 'string',
            enum: regions,
            errorMessage: {
              enum: `The region must be one of ${regions.join(', ')}`,
            },
          },
        },
        errorMessage: {
          required: {
            region: 'You need to specify a region for the service',
          },
        },
      }),
    )(srv)
