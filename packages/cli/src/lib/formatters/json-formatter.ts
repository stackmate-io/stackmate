import { FileFormatter } from '@stackmate/cli/types';

class JsonFormatter implements FileFormatter {
  /**
   * Serializes the output into the JSON format
   *
   * @param {Object} contents the configuration file's content
   */
  serialize(contents: object): string {
    return JSON.stringify(contents, null, 2);
  }

  /**
   * Deserializes a JSON file's contents into an object
   *
   * @param {String} contents the content to deserialize
   * @returns {Object} the file's content deserialized to an object
   */
  deserialize(contents: string): object {
    return JSON.parse(contents);
  }
}

export default JsonFormatter;
