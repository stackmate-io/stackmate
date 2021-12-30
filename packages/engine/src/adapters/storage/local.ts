import { promises as fsPromises } from 'fs';

import BaseStorageAdapter from '@stackmate/adapters/storage/base';
import { AttributeParsers, Validations } from '@stackmate/types';
import { parseFileName } from '@stackmate/lib/parsers';
import { Attribute } from '@stackmate/lib/decorators';

class LocalFileAdapter extends BaseStorageAdapter {
  /**
   * @var {Object} options the options for the storage
   */
  @Attribute path: string;

  /**
   * @var {String} validationMessage the error message
   */
  public readonly validationMessage: string = 'The file information provided is not valid';

  parsers(): AttributeParsers {
    return {
      path: parseFileName,
    };
  }

  validations(): Validations {
    return {
      path: {
        presence: {
          allowEmpty: false,
          message: 'You have to provide a valid file path',
        },
        validateFileExistence: {},
      },
    };
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
