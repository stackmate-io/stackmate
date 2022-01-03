import Entity from '@stackmate/lib/entity';
import { getFormatter } from '@stackmate/adapters/formatters';
import { getStorageAdapter } from '@stackmate/adapters/storage';
import { ConfigurationResource, Formatter, StorageAdapter } from '@stackmate/interfaces';
import { FormatChoice, StorageChoice } from '@stackmate/types';

abstract class Configuration extends Entity implements ConfigurationResource {
  /**
   * @var {StorageAdapter} storageAdapter the storage adapter to use
   * @protected
   */
  protected storageAdapter: StorageAdapter;

  /**
   * @var {Formatter} formatter the format adapter to use
   * @protected
   */
  protected formatter: Formatter;

  /**
   * @var {Object} contents the file's contents in a structured format
   * @protected
   */
  protected contents: object;

  /**
   * @var {Boolean} isWriteable whether we can write to the file
   * @readonly
   */
  readonly isWriteable: boolean = true;

  /**
   * @constructor
   * @param {StorageAdapter} storageAdapter the storage adapter to fetch & push values
   * @param {Formatter} formatter the formatter to parse values with
   */
  constructor(storageAdapter: StorageAdapter, formatter: Formatter) {
    super();

    this.storageAdapter = storageAdapter;
    this.formatter = formatter;
  }

  /**
   * Opens, reads and parses the file contents
   * @returns {Promise<Object>} the parsed file's contents
   * @async
   */
  async read(): Promise<object> {
    const rawContents = await this.storageAdapter.read();
    const parsedContents = await this.formatter.parse(rawContents);

    this.contents = this.normalize(parsedContents);
    return this.contents;
  }

  /**
   * Writes out the stringified contents in the storage
   *
   * @returns {Promise<String>} the written file's contents
   * @async
   */
  async write(): Promise<void> {
    if (!this.isWriteable) {
      throw new Error('File is not writeable');
    }

    const formatted = await this.formatter.export(this.contents);

    await this.storageAdapter.write(formatted);
  }

  /**
   * Instantiates, validates and provisions a service
   *
   * @param {ServiceAttributes} attributes the service's attributes
   * @param {Object} stack the terraform stack object
   * @param {Object} prerequisites any prerequisites by the cloud provider
   */
  static async load<T extends Configuration>(
    this: new (...args: any[]) => T,
    storage: StorageChoice,
    storageOptions: object,
    format: FormatChoice,
  ): Promise<T> {
    const storageAdapter = getStorageAdapter(storage, storageOptions);
    const formatter = getFormatter(format);

    const conf = new this(storageAdapter, formatter);
    conf.attributes = await conf.read();
    conf.validate();

    return conf;
  }
}

export default Configuration;
