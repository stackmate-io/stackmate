import Entity from '@stackmate/lib/entity';
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
   * @var {StorageAdapter} storageAdapter the storage adapter to fetch & push values
   * @abstract
   */
  public abstract get storage(): StorageAdapter;

  /**
   * Opens, reads and parses the file contents
   * @returns {Promise<Object>} the parsed file's contents
   * @async
   */
  async read(): Promise<object> {
    const contents = await this.storage.read();
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

    await this.storage.write(this.contents);
  }

  /**
   * Instantiates and validates a configuration resource
   */
  async load(): Promise<ConfigurationResource> {
    this.attributes = await this.read();
    this.validate();
    return this;
  }
}

export default Configuration;
