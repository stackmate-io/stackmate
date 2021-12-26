import crypto from 'crypto';
import { isObject } from 'lodash';

/**
 * Returns an MD5 hash of an object
 *
 * @param {Object} obj the object to create a hash from
 * @returns {String} the md5 hash
 */
export const hashObject = (obj: object): string => (
  crypto.createHash('md5').update(JSON.stringify(obj)).digest('hex').toString()
);

/**
 * Returns whether the given object is a subset of another object
 *
 * @param {Object} subObj the subset object
 * @param {Object} superObj the superset object
 * @returns {Boolean}
 */
export const isKeySubset = (subObj: any, superObj: any): boolean => (
  Object.keys(subObj).every((key) => {
    if (isObject(subObj[key])) {
      return isKeySubset(superObj[key], subObj[key]);
    }

    return key in subObj && key in superObj;
  })
);
