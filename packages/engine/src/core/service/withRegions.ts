import pipe from '@bitty/pipe';
import { BaseServiceAttributes, withServiceProperties, withSchema, Service } from './core';

/**
 * @type {RegionalAttributes} region-specific attributes
 */
export type RegionalAttributes<T extends string = string> = { region: T; };

/**
 * Enhances a service to support regions
 *
 * @param {String[]} regions the regions that the service can be provisioned in
 * @param {String} defaultRegion the default region to provision the service in
 * @returns {Function<Service>}
 */

export const withRegions = <C extends BaseServiceAttributes>(
  regions: readonly string[], defaultRegion: string
) => <T extends Service<C>>(srv: T): T & { regions: readonly string[] } => (
  pipe(
    withServiceProperties<C, { regions: readonly string[] }>({ regions }),
    withSchema<C, RegionalAttributes>({
      type: 'object',
      required: ['region'],
      properties: {
        region: {
          type: 'string',
          enum: regions,
          default: defaultRegion,
          errorMessage: `The region is invalid. Available options are: ${regions.join(', ')}`
        },
      },
    }),
  )(srv)
);
