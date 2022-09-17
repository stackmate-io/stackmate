import { BaseServiceAttributes, withSchema } from './core';

/**
 * @type {VersioningAttributes} version attributes
 */

export type VersioningAttributes = { version: string; };
/**
 * Adds version support to a service (eg. database version to run)
 *
 * @param {String} versions the versions available to the service
 * @param {String} defaultVersion the default version for the service
 * @returns {Function<Service>}
 */

export const versioned = <C extends BaseServiceAttributes>(
  versions: readonly string[], defaultVersion: string
) => withSchema<C, VersioningAttributes>({
  type: 'object',
  properties: {
    version: {
      type: 'string',
      enum: versions,
      default: defaultVersion,
    },
  }
});
