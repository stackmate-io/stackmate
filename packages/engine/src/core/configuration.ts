import Entity from '@stackmate/lib/entity';
import { StorageChoice } from '@stackmate/types';
import { getStorageAdapter } from '@stackmate/storage';
import { ConfigurationResource, StorageAdapter } from '@stackmate/interfaces';

abstract class Configuration extends Entity implements ConfigurationResource {
  /**
   * @var {StorageAdapter} storageAdapter the storage adapter to use
   * @protected
   */
  protected storageAdapter: StorageAdapter;

  /**
   * @var {Object} contents the file's contents in a structured format
   * @protected
   */
  private contents: object;

  /**
   * @var {Boolean} isWriteable whether we can write to the file
   * @readonly
   */
  readonly isWriteable: boolean = true;

  /**
   * @constructor
   * @param {StorageAdapter} storageAdapter the storage adapter to fetch & push values
   */
  constructor(storageAdapter: StorageAdapter) {
    super();

    this.storageAdapter = storageAdapter;
  }

  /**
   * Opens, reads and parses the file contents
   * @returns {Promise<Object>} the parsed file's contents
   * @async
   */
  async read(): Promise<object> {
    const contents = await this.storageAdapter.read();
    this.contents = this.normalize(contents);
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

    await this.storageAdapter.write(this.contents);
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
    additionalAttributes: object = {},
  ): Promise<T> {
    const conf = new this(getStorageAdapter(storage, storageOptions));
    const attrs = await conf.read();

    conf.attributes = { ...attrs, ...additionalAttributes };
    conf.validate();

    return conf;
  }
}

export default Configuration;
