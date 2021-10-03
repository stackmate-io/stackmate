import LocalFileAdapter from '@stackmate/core/adapters/storage/local';
import JsonFormatter from '@stackmate/core/adapters/format/json';
import YamlFormatter from '@stackmate/core/adapters/format/yml';
import { FORMAT, STORAGE } from '@stackmate/core/constants';
import { Cached } from '@stackmate/core/decorators';
import { Formatter, StorageAdapter } from '@stackmate/interfaces';

abstract class Configuration {
  /**
   * @var {Object} contents the file's contents in a structured format
   */
  contents: object;

  /**
   * @var {String} path the path to the file
   */
  path: string;

  /**
   * @var {String} storage the storage option (whether local or remote)
   */
  storage: string;

  /**
   * @var {String} format the file's format (eg. YML, JSON)
   */
  abstract format: string;

  /**
   * @var {Boolean} isWriteable whether we can write to the file
   * @readonly
   */
  readonly isWriteable: boolean = true;

  constructor(path: string, storage: string = STORAGE.FILE) {
    this.path = path;
    this.storage = storage;
  }

  /**
   * @returns {StorageAdapter} the storage adapter to use
   * @throws {Error} when the storage option is not valid
   */
  @Cached()
  public get storageAdapter(): StorageAdapter {
    if (this.storage === STORAGE.FILE) {
      return new LocalFileAdapter(this.path);
    }

    throw new Error(`Invalid storage “${this.storage}” specified`);
  }

  /**
   * @returns {Formatter} the formatter to use to parse & write the file
   * @throws {Error} when the format is not valid
   */
  @Cached()
  public get formatter(): Formatter {
    if (this.format === FORMAT.YML) {
      return new YamlFormatter();
    }

    if (this.format === FORMAT.JSON) {
      return new JsonFormatter();
    }

    throw new Error(`Invalid format “${this.format}” specified`);
  }

  /**
   * Opens, reads and parses the file contents
   * @returns {Promise<Object>} the parsed file's contents
   * @async
   */
  async load(): Promise<object> {
    const rawContents = await this.storageAdapter.read();
    const parsedContents = await this.formatter.parse(rawContents);

    this.contents = this.normalize(parsedContents);
    return this.contents;
  }

  /**
   * Normalizes the configuration file's contents (if necessary)
   *
   * @param {Object} contents the contents prior to normalization
   * @returns {Object} the normalized object
   */
  normalize(contents: object): object {
    return contents;
  }

  /**
   * Writes out the stringified contents in the storage
   *
   * @returns {Promise<String>} the written file's contents
   * @async
   */
  async write(): Promise<string> {
    if (!this.isWriteable) {
      throw new Error('File is not writeable');
    }

    const stringified = await this.formatter.export(this.contents);

    return this.storageAdapter.write(stringified);
  }
}

export default Configuration;
