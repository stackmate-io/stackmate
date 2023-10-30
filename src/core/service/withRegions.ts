import pipe from 'lodash/fp/pipe';

import { BaseServiceAttributes, withServiceProperties, withSchema, Service } from './core';

/**
 * @type {RegionalAttributes} region-specific attributes
 */
export type RegionalAttributes<T extends string = string> = { region: T; };

/**
 * @type {AdditionalProps} the service additional properties
 */
type AdditionalProps = { regions: readonly string[] };

/**
 * Enhances a service to support regions
 *
 * @param {String[]} regions the regions that the service can be provisioned in
 * @param {String} defaultRegion the default region to provision the service in
 * @returns {Function<Service>}
 */
export const withRegions = <C extends BaseServiceAttributes>(
  regions: readonly string[], defaultRegion: string
) => <T extends Service<C>>(srv: T): T & AdditionalProps => (
  pipe(
    withServiceProperties<C, AdditionalProps>({ regions }),
    withSchema<C, RegionalAttributes>({
      type: 'object',
      properties: {
        region: {
          type: 'string',
          enum: regions,
          default: defaultRegion,
          errorMessage: {
            enum: `The region must be one of ${regions.join(', ')}`,
          },
        },
      },
    }),
  )(srv)
);
