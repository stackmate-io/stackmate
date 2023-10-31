import { Fn, Token } from 'cdktf'

/**
 * Extracts a key from a username / password pair in a data string
 *
 * @param {String} encoded the encoded string
 * @param {String} key the key to get
 * @param {String} defaultValue the default value
 */
export const extractTokenFromJsonString = (
  encoded: string,
  key: string,
  defaultValue: string = '',
): string => Token.asString(Fn.lookup(Fn.jsondecode(encoded), key, defaultValue))
