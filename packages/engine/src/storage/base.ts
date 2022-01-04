import Entity from '@stackmate/lib/entity';
import { StorageAdapter } from '@stackmate/interfaces';

abstract class BaseStorageAdapter extends Entity implements StorageAdapter {
  /**
   * @param {Object} contents the contents to serialize
   * @returns {String|Object} the serialized output
   */
  abstract serialize(contents: object): string | object;

  /**
   * @param {String|Object} serialized the serialized contents
   * @returns {Object} the deserialized data
   */
  abstract deserialize(serialized: string | object): object;

  /**
   * @returns {Promise<String>} the raw content as fetched from the source
   * @async
   */
  abstract read(): Promise<object>;

  /**
   * @returns {Promise<String>}
   * @async
   */
  abstract write(contents: object): Promise<void>;

  /**
   * @var {Object} options the options to use for this storage adapter
   * @protected
   * @readonly
   */
  protected readonly options: object;

  /**
   * @constructor
   * @param {Object} options the options to set
   */
  constructor(options: object) {
    super();

    this.options = options;
  }

  /**
   * Instantiates, validates and provisions a storage adapter
   *
   * @param {Object} options the storage options
   * @param {Object} attributes the storage adapter's attributes
   */
  static factory<T extends BaseStorageAdapter>(
    this: new (...args: any[]) => T,
    attributes: object = {},
    options: object = {},
  ): T {
    const adapter = new this(options);
    adapter.attributes = attributes;
    adapter.validate();
    return adapter;
  }
}

export default BaseStorageAdapter;
