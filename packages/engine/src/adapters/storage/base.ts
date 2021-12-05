import Entity from '@stackmate/lib/entity';
import { StorageAdapter } from '@stackmate/interfaces';
import { Validations } from '@stackmate/types';

abstract class BaseStorageAdapter extends Entity implements StorageAdapter {
  /**
   * @var {Object} options any extra options provided by the parent class
   */
  readonly options: object;

  constructor(options = {}) {
    super();

    this.validate(options);
    this.options = options;
  }

  /**
   * @returns {Object} the validations to use
   */
  validations(): Validations {
    return {};
  }

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
