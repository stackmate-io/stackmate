import AwsParametersStorage from '@stackmate/storage/aws-params';
import FileStorage from '@stackmate/storage/file';
import { STORAGE } from '@stackmate/constants';
import { StorageAdapter, StorageStrategy } from '@stackmate/interfaces';
import { StorageChoice } from '@stackmate/types';

class Storage implements StorageAdapter {
  /**
   * @var {StorageStrategy} strategy the storage strategy to use
   */
  protected readonly strategy: StorageStrategy;

  /**
   * @var {Boolean} isWriteable whether we can write to the file
   * @readonly
   */
  readonly isWriteable: boolean = true;

  /**
   * @constructor
   * @param {String} type the type of storage to use
   * @param {Object} attributes the attributes to assign to the storage strategy
   * @param {Boolean} isWriteable whether we can write on the storage adapter
   */
  constructor(type: StorageChoice, attributes: object, isWriteable = true) {
    this.isWriteable = isWriteable;

    this.strategy = this.decide(type);
    this.strategy.attributes = attributes;
    this.strategy.validate();
  }

  /**
   * Decides which storage strategy to use
   *
   * @param {String} type the storage type
   * @returns {StorageStrategy}
   * @throws {Error} when the type is invalid
   */
  protected decide(type: StorageChoice): StorageStrategy {
    if (type === STORAGE.AWS) {
      return new AwsParametersStorage();
    }

    if (type === STORAGE.FILE) {
      return new FileStorage();
    }

    throw new Error(`Invalid storage type ${type} provided. Available options are ${Object.values(STORAGE).join(', ')}`)
  }

  /**
   * Opens, reads and parses the contents from the storage
   *
   * @returns {Promise<Object>} the deserialized contents
   * @async
   */
  async read(): Promise<object> {
    const contents = await this.strategy.read();
    return contents;
  }

  /**
   * Writes out the stringified contents in the storage
   *
   * @returns {Promise<String>} the contents to write
   * @void
   * @async
   */
  async write(contents: object): Promise<void> {
    if (!this.isWriteable) {
      throw new Error('Target is not writeable');
    }

    await this.strategy.write(contents);
  }
}

export default Storage;
