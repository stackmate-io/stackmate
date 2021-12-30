import { FormatChoice } from '@stackmate/types';
import { Formatter } from '@stackmate/interfaces';
import { FORMAT } from '@stackmate/constants';
import YamlFormatter from './yml';
import JsonFormatter from './json';
import RawFormatter from './raw';

/**
 * Returns a formatter instance based on a format choice
 *
 * @param {String} format the format to get the parser for
 * @returns {Formatter} the formatter instance
 */
const getFormatter = (format: FormatChoice): Formatter => {
  switch (format) {
    case FORMAT.YML:
      return new YamlFormatter();
    case FORMAT.JSON:
      return new JsonFormatter();
    case FORMAT.RAW:
      return new RawFormatter();
    default:
      throw new Error(`Invalid format “${format}” specified`);
  }
};

export {
  JsonFormatter,
  YamlFormatter,
  getFormatter,
};
