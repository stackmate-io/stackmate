import Entity from '@stackmate/lib/entity';
import { StorageAdapter } from '@stackmate/interfaces';

abstract class Loadable extends Entity {
  /**
   * @var {StorageAdapter} storageAdapter the storage adapter to fetch & push values
   * @abstract
   */
  public abstract get storage(): StorageAdapter;

  /**
   * Normalizes the attributes
   *
   * @param {Object} attributes the attributes to normalize
   * @returns {Object}
   */
  normalize(attributes: object): object {
    return attributes;
  }

  /**
   * Instantiates and validates a configuration resource
   *
   * @void
   */
  async load(): Promise<void> {
    const attributes = await this.storage.read();
    this.attributes = this.normalize(attributes);
    this.validate();
  }
}

export default Loadable;
