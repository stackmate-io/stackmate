import { isEmpty, isObject } from 'lodash';
import { Memoize } from 'typescript-memoize';

import { FORMAT, STORAGE } from '@stackmate/constants';
import { ConfigurationAttributes, StorageOptions } from '@stackmate/types';
import { JsonFormatter, YamlFormatter } from '@stackmate/adapters/formatters';
import { AwsParameterStore, LocalFileAdapter } from '@stackmate/adapters/storage';
import { ConfigurationResource, Formatter, StorageAdapter } from '@stackmate/interfaces';
import Entity from '@stackmate/lib/entity';

abstract class Configuration extends Entity implements ConfigurationResource {
  /**
   * @var {Object} contents the file's contents in a structured format
   */
  contents: object;

  /**
   * @var {String} storage the storage option (whether local or remote)
   */
  storage: string;

  /**
   * @var {Object} storageOptions any extra options to use for the storage adapter
   */
  storageOptions: StorageOptions = {};

  /**
   * @var {String} format the file's format (eg. YML, JSON)
   */
  abstract format: string;

  /**
   * @var {Boolean} isWriteable whether we can write to the file
   * @readonly
   */
  readonly isWriteable: boolean = true;

  constructor({ storage, ...storageOptions }: ConfigurationAttributes = { storage: STORAGE.FILE }) {
    super();

    this.storage = storage;

    if (isObject(storageOptions) && !isEmpty(storageOptions)) {
      this.storageOptions = storageOptions;
    }
  }

  /**
   * @returns {StorageAdapter} the storage adapter to use
   * @throws {Error} when the storage option is not valid
   */
  @Memoize()
  public get storageAdapter(): StorageAdapter {
    let adapter: StorageAdapter | undefined;

    if (this.storage === STORAGE.FILE) {
      adapter = new LocalFileAdapter();
    } else if (this.storage === STORAGE.AWS_PARAMS) {
      adapter = new AwsParameterStore();
    }

    if (!adapter) {
      throw new Error(`Invalid storage “${this.storage}” specified`);
    }

    adapter.attributes = this.storageOptions;
    adapter.validate();

    return adapter;
  }

  /**
   * @returns {Formatter} the formatter to use to parse & write the file
   * @throws {Error} when the format is not valid
   */
  @Memoize()
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
  async write(): Promise<void> {
    if (!this.isWriteable) {
      throw new Error('File is not writeable');
    }

    const stringified = await this.formatter.export(this.contents);

    await this.storageAdapter.write(stringified);
  }
}

export default Configuration;
