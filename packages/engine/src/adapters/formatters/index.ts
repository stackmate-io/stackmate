import { FormatChoice } from '@stackmate/types';
import { Formatter } from '@stackmate/interfaces';
import { FORMAT } from '@stackmate/constants';
import YamlFormatter from './yml';
import JsonFormatter from './json';

/**
 * Returns a formatter instance based on a format choice
 *
 * @param {String} format the format to get the parser for
 * @returns {Formatter} the formatter instance
 */
const getFormatter = (format: FormatChoice): Formatter => {
  if (format === FORMAT.YML) {
    return new YamlFormatter();
  }

  if (format === FORMAT.JSON) {
    return new JsonFormatter();
  }

  throw new Error(`Invalid format “${format}” specified`);
};

export {
  JsonFormatter,
  YamlFormatter,
  getFormatter,
};
