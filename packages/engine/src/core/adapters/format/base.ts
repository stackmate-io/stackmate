import { Formatter } from '@stackmate/interfaces';

abstract class BaseFormatter implements Formatter {
  /**
   * Parses a string to an object
   *
   * @param {String} raw the raw content to parse
   * @returns {Promise<object>} the parsed object
   */
  abstract parse(raw: string): Promise<object>;

  /**
   * Exports a (parsed) object to a string
   *
   * @param {Object} parsed the object to stringify
   * @returns {Promise<string>} the stringified object
   */
  abstract export(parsed: object): Promise<string>;
}

export default BaseFormatter;
