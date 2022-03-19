import fs from 'node:fs';
import path from 'node:path';
import { Memoize } from 'typescript-memoize';

import { FileErrors } from '@stackmate/cli/lib/errors';
import { FileFormatter, FileReader } from '@stackmate/cli/types';
import YamlFormatter from '@stackmate/cli/lib/formatters/yaml';
import JsonFormatter from '@stackmate/cli/lib/formatters/json';

class File implements FileReader {
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
    this.filename = path.resolve(filename);
    this.init();
  }

  /**
   * Initializes the formatter based on the file's extension
   */
  protected init() {
    this.directory = path.dirname(this.filename);
    this.extension = path.extname(this.filename).toLowerCase();

    switch(this.extension) {
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
   * @returns {Boolean} whether the file exists or not
   */
  @Memoize() get exists(): boolean {
    return fs.existsSync(this.filename);
  }

  /**
   * @returns {Boolean} whether the file is writeable or not
   */
  @Memoize() get isWriteable(): boolean {
    try {
      fs.accessSync(this.filename, fs.constants.W_OK);
      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * @returns {Boolean} whether the file is readable or not
   */
  @Memoize() get isReadable(): boolean {
    try {
      fs.accessSync(this.filename, fs.constants.R_OK);
      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * Reads a file and returns its contents
   *
   * @returns {Object} the file's contents
   */
  read(): object {
    if (!this.isReadable) {
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
      fs.mkdirSync(this.directory, { recursive: true });
    } catch (error) {
      throw new FileErrors.DirectoryNotWriteableError(this.directory);
    }

    if (!this.isWriteable) {
      throw new FileErrors.FileNotWriteableError(this.filename);
    }

    fs.writeFileSync(this.filename, this.formatter.serialize(contents));
  }

}

export default File;
