import { BaseServiceAttributes, withSchema } from './core';

/**
 * @type {DatabaseAttributes} database attributes
 */

export type DatabaseAttributes = { database: string; };
/**
 * Adds engine support to a service (eg. database or cache engine to run)
 *
 * @returns {Function<Service>}
 */

export const withDatabase = <C extends BaseServiceAttributes>(
  isRequired = false
) => withSchema<C, DatabaseAttributes>({
  type: 'object',
  required: isRequired ? ['database'] : [],
  properties: {
    database: {
      type: 'string',
      pattern: '[a-z0-9_]+',
      errorMessage: 'The database must be an alphanumeric that could contain underscores',
    },
  }
});
