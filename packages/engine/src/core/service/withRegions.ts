import { pipe } from 'lodash/fp';
import { BaseServiceAttributes, withServiceAttributes, withSchema } from './core';

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
) => pipe(
  withServiceAttributes({ regions }),
  withSchema<C, { region: string; }>({
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
  })
);
