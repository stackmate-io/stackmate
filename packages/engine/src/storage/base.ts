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
}

export default BaseStorageAdapter;
