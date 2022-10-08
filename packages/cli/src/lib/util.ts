import { isEmpty } from 'lodash';
import { ValidationError } from '@stackmate/engine';

/**
 * Parses a comma separated value
 *
 * @param {String} value the value to parse
 * @returns {String[]} the parsed value
 */
export const parseCommaSeparatedString = (value: string): string[] => (
  value.split(',').filter(v => !isEmpty(v)).map(v => v.trim())
);

/**
 * Used in inquirer validations where we need to return a string or boolean
 *
 * @param {Function} validator the validator function to use
 * @returns {Boolean | String} true in case of a successful validation, error message otherwise
 * @throws {Error} in case the error is not the expected one
 */
export const isValidOrError = (validator: Function): boolean | string => {
  try {
    validator();
    return true;
  } catch (err: any) {
    if (err instanceof ValidationError) {
      return err.message;
    }

    throw err;
  }
};
