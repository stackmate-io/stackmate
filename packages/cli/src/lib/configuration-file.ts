import fs from 'node:fs';
import path from 'node:path';
import { Memoize } from 'typescript-memoize';

import { FileErrors } from '@stackmate/cli/lib/errors';
import { CURRENT_DIRECTORY } from '@stackmate/cli/constants';
import { FileFormatter, FileStorage } from '@stackmate/cli/types';
import YamlFormatter from '@stackmate/cli/lib/formatters/yaml-formatter';
import JsonFormatter from '@stackmate/cli/lib/formatters/json-formatter';

/**
 * Represents a configuration file
 *
 * @class Configuration
 */
class ConfigurationFile implements FileStorage {
  /**
   * @var {String} filename the file's name
   */
  readonly filename: string;

  /**
   * @var {Map} formatters the formatters to apply for reading / writing
   */
  protected formatter: FileFormatter;

  /**
   * @var {String} directory the directory for the file
   */
  protected directory: string;

  /**
   * @var {String} extension the file's extension
   */
  protected extension: string;

  /**
   * @constructor
   * @param {String} filename the file's name
   */
  constructor(filename: string) {
    this.filename = path.resolve(CURRENT_DIRECTORY, filename);
    this.init();
  }

  /**
   * Initializes the formatter based on the file's extension
   */
  protected init() {
    this.directory = path.dirname(this.filename);
    this.extension = path.extname(this.filename).toLowerCase();

    switch (this.extension) {
      case '.yml':
      case '.yaml':
        this.formatter = new YamlFormatter();
        break;
      case '.json':
        this.formatter = new JsonFormatter();
        break;
      default:
        throw new Error(`File extension ${this.extension} is not supported`);
    }
  }

  /**
   * Checks whether a certain permission applies for a path
   *
   * @param {String} path the path to check
   * @param {Number} mode the permission to check
   * @returns {Boolean} whether the permission applies or not
   */
  protected hasAccess(path: string, mode: number): boolean {
    try {
      fs.accessSync(path, mode);
      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * @returns {Boolean} whether the file exists or not
   */
  @Memoize() get exists(): boolean {
    return fs.existsSync(this.filename);
  }

  /**
   * @returns {Boolean} whether the file is readable or not
   */
  @Memoize() get readable(): boolean {
    return this.hasAccess(this.filename, fs.constants.R_OK);
  }

  /**
   * @returns {Boolean} whether the file is writeable
   */
  @Memoize() get writeable(): boolean {
    if (!this.exists) {
      return this.directoryWriteable;
    }

    return this.hasAccess(this.filename, fs.constants.W_OK);
  }

  /**
   * @returns {Boolean} whether the file is writeable or not
   */
  @Memoize() get directoryWriteable(): boolean {
    return this.hasAccess(this.directory, fs.constants.W_OK);
  }

  /**
   * Reads a file and returns its contents
   *
   * @returns {Object} the file's contents
   */
  read(): object {
    if (!this.readable) {
      throw new FileErrors.FileDoesNotExistError(this.filename);
    }

    const contents = fs.readFileSync(this.filename).toString();
    return this.formatter.deserialize(contents);
  }

  /**
   * Writes the contents to the file file
   *
   * @returns {Object} the file's contents
   */
  write(contents: object): void {
    try {
      fs.mkdirSync(this.directory, { mode: 0o755, recursive: true });
    } catch (error) {
      throw new FileErrors.DirectoryNotWriteableError(this.directory);
    }

    if (!this.writeable) {
      throw new FileErrors.FileNotWriteableError(this.filename);
    }

    fs.writeFileSync(this.filename, this.formatter.serialize(contents));
  }

}

export default ConfigurationFile;
