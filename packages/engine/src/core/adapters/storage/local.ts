import fs from 'fs';
import { resolve as resolvePath } from 'path';

import BaseStorageAdapter from '@stackmate/core/adapters/storage/base';

class LocalFileAdapter extends BaseStorageAdapter {
  /**
   * @var {String} encoding the encoding to use for the file
   * @protected
   * @readonly
   */
  protected readonly encoding: string = 'utf-8';

  transformPath(path: string): string {
    return resolvePath(path);
  }

  async read(): Promise<string> {
    const contents = await fs.promises.readFile(this.path);
    return contents.toString();
  }

  async write(contents: string): Promise<string> {
    await fs.promises.writeFile(this.path, contents, { encoding: this.encoding });
    return contents;
  }
}

export default LocalFileAdapter;
