import { promises as fsPromises } from 'fs';

import BaseStorageAdapter from '@stackmate/core/adapters/storage/base';

class AwsParameterStore extends BaseStorageAdapter {
  async read(): Promise<string> {
    const contents = await fsPromises.readFile(this.path);
    return contents.toString();
  }

  async write(contents: string): Promise<void> {
    await fsPromises.writeFile(this.path, contents, { encoding: 'utf-8' });
  }
}

export default AwsParameterStore;
