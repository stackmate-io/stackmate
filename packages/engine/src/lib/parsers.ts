import { resolve as resolvePath } from 'path';
import { isArray, isNil, isNumber, isObject, isString, omitBy, uniq } from 'lodash';

import { CredentialsObject } from '@stackmate/types';

/**
 * Parses a string
 *
 * @param {String} value the value to parse
 * @returns {String} the parsed value
 */
export const parseString = (value: string): string => (
  String(value || '').trim()
);

/**
 * Parses an array to a set of values
 *
 * @param {Array} value the array value to parse
 * @returns {Set} the set containing the values
 */
export const parseArrayToSet = (value: Array<any>): Set<any> => (
  new Set(value || [])
);

/**
 * Parses an object value
 *
 * @param {Object} obj the object to parse
 * @returns {Object} the parsed object
 */
export const parseObject = (obj: object): object => (
  isObject(obj) ? obj : {}
);

/**
 * Parses an array to an array of unique values
 *
 * @param {Array} value the value to make unique
 * @returns {Array} the value containing only unique entries
 */
export const parseArrayToUniqueValues = (value: Array<any>): Array<any> => (
  isArray(value) ? uniq(value) : []
);

/**
 * Parses a number or a string to an Integer
 *
 * @param {Number|String} value the value to parse
 * @returns {Number} the value provided as integer
 */
export const parseInteger = (value: number | string): number => (
  isNumber(value) ? Number(value) : parseInt(value, 10)
);

/**
 * Parses a value as boolean
 *
 * @param {Number|String} value the value to parse
 * @returns {Boolean} the value provided as a boolean
 */
export const parseBoolean = (value: number | string): Boolean => (
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
export const parseCredentials = ({ username, password }: CredentialsObject): CredentialsObject => (
  omitBy({
    username: isString(username) ? username.trim() : null,
    password: isString(password) ? password.trim() : null,
  }, isNil)
);

/**
 * @param {String} path the path to parse
 * @returns {String} the parsed and resolved path
 */
export const parseFileName = (path: string) => (
  resolvePath(path.trim())
);
