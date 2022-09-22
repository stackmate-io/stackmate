import YAML from 'yaml';

import { getFileExtension } from './filesystem';

export type FileFormatter = {
  serialize(contents: object): string;
  deserialize(contents: string): object;
};

export class JsonFormatter implements FileFormatter {
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

export class YamlFormatter implements FileFormatter {
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

export const getFormatterByFilename = (filename: string): FileFormatter => {
  const extension = getFileExtension(filename);

  switch (extension) {
    case '.yml':
    case '.yaml':
      return new YamlFormatter();
    case '.json':
      return new JsonFormatter();
    default:
      throw new Error(`File extension ${extension} is not supported`);
  }
};
