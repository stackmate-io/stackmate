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
      pattern: '^([a-z0-9_]+)$',
      minLength: 3,
      errorMessage: {
        pattern: 'The database name must be an alphanumeric that could contain underscores',
        minLength: 'The database name must be 3 characters or more',
      },
    },
  }
});
