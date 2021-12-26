import YAML from 'yaml';

import BaseFormatter from '@stackmate/adapters/formatters/base';

class YamlFormatter extends BaseFormatter {
  /**
   * @var {object} exportOptions the options to use when reading from YAML
   * @protected
   * @readonly
   */
  protected readonly parseOptions: object = {};

  /**
   * @var {object} exportOptions the options to use when exporting to YAML
   * @protected
   * @readonly
   */
  protected readonly exportOptions: object = {};

  async parse(raw: string): Promise<object> {
    return YAML.parse(raw.toString().trim(), this.parseOptions);
  }

  async export(parsed: object): Promise<string> {
    return YAML.stringify(parsed, this.exportOptions);
  }
}

export default YamlFormatter;
