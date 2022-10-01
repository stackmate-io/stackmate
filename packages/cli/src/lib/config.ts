import path from 'node:path';

import { CURRENT_DIRECTORY } from '@stackmate/cli/constants';
import { FileFormatter, FileStorage, getFormatterByFilename, readFile, writeFile } from '@stackmate/cli/lib';

/**
 * Represents a configuration file
 *
 * @class Configuration
 */
export class ConfigurationFile implements FileStorage {
  /**
   * @var {String} filename the file's name
   */
  readonly filename: string;

  /**
   * @var {String} raw the raw file contents
   */
  #raw: string;

  /**
   * @var {Map} formatters the formatters to apply for reading / writing
   */
  protected formatter: FileFormatter;

  /**
   * @constructor
   * @param {String} filename the file's name
   */
  constructor(filename: string) {
    this.filename = path.resolve(CURRENT_DIRECTORY, filename);
    this.formatter = getFormatterByFilename(this.filename);
    this.#raw = readFile(this.filename);
  }

  /**
   * @return {String} the raw file contents
   */
  get raw(): string {
    return this.#raw;
  }

  /**
   * Reads a file and returns its contents
   *
   * @returns {Object} the file's contents
   */
  read(): object {
    return this.formatter.deserialize(this.#raw);
  }

  /**
   * Writes the contents to the file file
   *
   * @returns {Object} the file's contents
   */
  write(contents: object): void {
    this.#raw = this.formatter.serialize(contents);
    writeFile(this.filename, this.formatter.serialize(contents));
  }
}
