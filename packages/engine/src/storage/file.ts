import YAML from 'yaml';
import { promises as fsPromises } from 'fs';

import BaseStorageAdapter from '@stackmate/storage/base';
import { AttributeParsers, Validations } from '@stackmate/types';
import { parseFileName, parseString } from '@stackmate/lib/parsers';
import { Attribute } from '@stackmate/lib/decorators';
import { FORMAT } from '@stackmate/constants';

class FileStorageAdapter extends BaseStorageAdapter {
  /**
   * @var {Object} options the options for the storage
   */
  @Attribute path: string;

  /**
   * @var {String} format the format of the file
   */
  @Attribute format: string = FORMAT.YML;

  /**
   * @var {String} validationMessage the error message
   */
  public readonly validationMessage: string = 'The file information provided is not valid';

  parsers(): AttributeParsers {
    return {
      path: parseFileName,
      format: parseString,
    };
  }

  validations(): Validations {
    const formats = Object.values(FORMAT);

    return {
      path: {
        presence: {
          allowEmpty: false,
          message: 'You have to provide a valid file path',
        },
        validateFileExistence: {},
      },
      format: {
        inclusion: {
          within: Object.values(formats),
          message: `The format provided for the file is invalid. Available options are: ${formats.join(', ')}`,
        },
      }
    };
  }

  /**
   * @param {Object} contents the contents to serialize
   * @returns {String|Object} the serialized output
   */
  serialize(contents: object): string {
    if (this.format === FORMAT.YML) {
      return YAML.stringify(contents);
    }

    if (this.format === FORMAT.JSON) {
      return JSON.stringify(contents, null, 2);
    }

    throw new Error('Invalid format specified');
  }

  /**
   * @param {String|Object} serialized the serialized contents
   * @returns {Object} the deserialized data
   */
  deserialize(serialized: string): object {
    if (this.format === FORMAT.YML) {
      return YAML.parse((serialized || '').trim(), {});
    }

    if (this.format === FORMAT.JSON) {
      return JSON.parse(serialized);
    }

    throw new Error('Invalid format specified');
  }

  /**
   * Reads the file contents
   *
   * @returns {String}
   * @async
   */
  async read(): Promise<object> {
    const contents = await fsPromises.readFile(this.path)
    return this.deserialize(contents.toString());
  }

  /**
   * Writes a file given a stringified content
   *
   * @param {String} contents the file contents to write out
   * @void
   * @async
   */
  async write(contents: object): Promise<void> {
    await fsPromises.writeFile(this.path, this.serialize(contents), { encoding: 'utf-8' });
  }
}

export default FileStorageAdapter;
