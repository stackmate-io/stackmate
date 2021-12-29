import Entity from '@stackmate/lib/entity';
import { StorageAdapter } from '@stackmate/interfaces';

abstract class BaseStorageAdapter extends Entity implements StorageAdapter {
  /**
   * @returns {Promise<String>} the raw content as fetched from the source
   * @async
   */
  abstract read(): Promise<string | object>;

  /**
   * @param {String} contents the contents to write
   * @returns {Promise<String>}
   * @async
   */
  abstract write(contents: string | object): Promise<void>;
}

export default BaseStorageAdapter;
