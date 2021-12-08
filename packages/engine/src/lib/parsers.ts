import { CredentialsObject } from '@stackmate/types';
import { isArray, isNumber, isString, uniq } from 'lodash';

/**
 * Parses a string
 *
 * @param {String} value the value to parse
 * @returns {String} the parsed value
 */
export const parseString = (value: string) => (
  String(value || '').trim()
);

/**
 * Parses an array to a set of values
 *
 * @param {Array} value the array value to parse
 * @returns {Set} the set containing the values
 */
export const parseArrayToSet = (value: Array<any>) => (
  new Set(value || [])
);

/**
 * Parses an array to an array of unique values
 *
 * @param {Array} value the value to make unique
 * @returns {Array} the value containing only unique entries
 */
export const parseArrayToUniqueValues = (value: Array<any>) => (
  isArray(value) ? uniq(value) : []
);

/**
 * Parses a number or a string to an Integer
 *
 * @param {Number|String} value the value to parse
 * @returns {Number} the value provided as integer
 */
export const parseInteger = (value: number | string) => (
  isNumber(value) ? Number(value) : parseInt(value, 10)
);

/**
 * Parses a value as boolean
 *
 * @param {Number|String} value the value to parse
 * @returns {Boolean} the value provided as a boolean
 */
export const parseBoolean = (value: number | string) => (
  Boolean(value)
);

/**
 * Parses a credentials object
 *
 * @param {Credentials} credentials
 * @param {String} credentials.username the credentials username
 * @param {String} credentials.password the credentials password
 * @returns {Credentials}
 */
export const parseCredentials = ({ username, password }: CredentialsObject) => ({
  username: isString(username) ? username.trim() : null,
  password: isString(password) ? password.trim() : null,
});
