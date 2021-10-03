import { promises as fsPromises } from 'fs';
import { resolve as resolvePath } from 'path';

import BaseStorageAdapter from '@stackmate/core/adapters/storage/base';

class LocalFileAdapter extends BaseStorageAdapter {
  transformPath(path: string): string {
    return resolvePath(path);
  }

  async read(): Promise<string> {
    const contents = await fsPromises.readFile(this.path);
    return contents.toString();
  }

  async write(contents: string): Promise<string> {
    await fsPromises.writeFile(this.path, contents, { encoding: 'utf-8' });
    return contents;
  }
}

export default LocalFileAdapter;
