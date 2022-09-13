import crypto from 'node:crypto';

import { sampleSize } from 'lodash';

/**
 * Returns an MD5 hash of a string
 *
 * @param {String} str the string to create a hash from
 * @returns {String} the md5 hash
 */
export const hashString = (str: string): string => (
  crypto.createHash('md5').update(str).digest('hex').toString()
);

/**
 * Returns an MD5 hash of an object
 *
 * @param {Object} obj the object to create a hash from
 * @returns {String} the md5 hash
 */
export const hashObject = (obj: object): string => (
  hashString(JSON.stringify(obj))
);

/**
 * Generates a random string
 *
 * @param {Object} opts
 * @param {Number} opts.length the length of the generated string
 * @param {Boolean} opts.special whether to allow special characters or not
 * @param {String[]} opts.exclude the list of characters to exclude
 * @returns {String} the generated string
 */
export const getRandomString = ({
  length = 16,
  special = true,
  safe = true,
  exclude = [],
}: {
  length?: number;
  special?: Boolean;
  safe?: Boolean;
  exclude?: string[];
} = {}): string => {
  const unsafe = '\',.|`/"';
  const alphanumeric = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const specialCharacters = '!#$%&()*+:;-<=>?@[]^_{}~';
  const characters = [...alphanumeric.split('')];

  if (special) {
    characters.push(...specialCharacters.split(''));

    if (!safe) {
      characters.push(...unsafe.split(''));
    }
  }

  return sampleSize(characters, length).join('');
};

/**
 * Returns an identifier that is highly likely to be unique
 *
 * @param {String} prefix any prefix to use
 * @param {object} hashable the hashable object
 * @param {Object} options any additional options to provide
 * @param {String} options.separator the separator to use for joining the parts
 * @param {Number} options.length the length of the token
 * @returns {String} the unique identifier
 */
export const uniqueIdentifier = (
  prefix: string = '',
  hashable: object = {},
  { separator = '-', length = null }: { separator?: string, length?: number | null } = {},
): string => {
  const hash = hashString(`${crypto.randomUUID()}${hashObject(hashable)}`);
  const token = length ? hash.substring(0, length - 1) : hash;
  return [prefix, token].join(separator);
};
