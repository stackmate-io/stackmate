import BaseFormatter from '@stackmate/core/adapters/formatters/base';

class RawFormatter extends BaseFormatter {
  /**
   * @var {Number} spacing the amount of white space characters to use
   * @readonly
   */
  readonly spacing: number = 2;

  async parse(raw: object): Promise<object> {
    return raw;
  }

  async export(parsed: object): Promise<object|string> {
    return parsed;
  }
}

export default RawFormatter;
