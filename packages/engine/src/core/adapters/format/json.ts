import BaseFormatter from '@stackmate/core/adapters/format/base';

class JsonFormatter extends BaseFormatter {
  /**
   * @var {Number} spacing the amount of white space characters to use
   * @readonly
   */
  readonly spacing: number = 2;

  async parse(raw: string): Promise<object> {
    return JSON.parse(raw);
  }

  async export(parsed: object): Promise<string> {
    return JSON.stringify(parsed, null, this.spacing);
  }
}

export default JsonFormatter;
