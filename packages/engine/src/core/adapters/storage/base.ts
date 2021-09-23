import { StorageAdapter } from '@stackmate/interfaces';

abstract class BaseStorageAdapter implements StorageAdapter {
  /**
   * @var {String} path the path to read and write
   */
  readonly path: string;

  constructor(path: string) {
    this.path = this.transformPath(path);
  }

  /**
   * Transforms the path (eg. resolve from relative to absolute url)
   *
   * @param {String} path the path to transform
   * @returns {String} the transformed path
   */
  transformPath(path: string): string {
    return path;
  }

  /**
   * @returns {Promise<String>} the raw content as fetched from the source
   * @async
   */
  abstract read(): Promise<string>;

  /**
   * @param {String} contents the contents to write
   * @returns {Promise<String>}
   * @async
   */
  abstract write(contents: string): Promise<string>;
}

export default BaseStorageAdapter;
