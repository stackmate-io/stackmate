import { isString } from 'lodash';
import { promises as fsPromises } from 'fs';
import { resolve as resolvePath } from 'path';

import BaseStorageAdapter from '@stackmate/core/adapters/storage/base';
import { LocalFileStorageOptions } from '@stackmate/types';

class LocalFileAdapter extends BaseStorageAdapter {
  /**
   * @var {String} path the path to read and write
   */
  readonly path: string;

  constructor(options: LocalFileStorageOptions) {
    super(options);

    ({ path: this.path } = options);

    if (!this.path || !isString(this.path)) {
      throw new Error('A path is required');
    }
  }

  /**
   * Resolves a path as an absolute one
   *
   * @param {String} path the path to resolve
   * @returns {String}
   */
  transformPath(path: string): string {
    return resolvePath(path);
  }

  /**
   * Reads the file contents
   *
   * @returns {String}
   * @async
   */
  async read(): Promise<string> {
    const contents = await fsPromises.readFile(this.path);
    return contents.toString();
  }

  /**
   * Writes a file given a stringified content
   *
   * @param {String} contents the file contents to write out
   * @void
   * @async
   */
  async write(contents: string): Promise<void> {
    await fsPromises.writeFile(this.path, contents, { encoding: 'utf-8' });
  }
}

export default LocalFileAdapter;
