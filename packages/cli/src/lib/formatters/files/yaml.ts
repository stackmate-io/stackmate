import YAML from 'yaml';

import { FileFormatter } from '@stackmate/cli/types';

class YamlFormatter implements FileFormatter {
  /**
   * Serializes the output into a YAML string
   *
   * @param {Object} contents the configuration file's content
   */
  serialize(contents: object): string {
    return YAML.stringify(contents);
  }

  /**
   * Deserializes a YAML file's content into an object
   *
   * @param {String} contents the content to deserialize
   * @returns {Object} the file's content deserialized to an object
   */
  deserialize(contents: string): object {
    return YAML.parse(contents);
  }
}

export default YamlFormatter;
