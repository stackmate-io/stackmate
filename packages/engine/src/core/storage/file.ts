import YAML from 'yaml';
import { promises as fsPromises } from 'fs';

import Entity from '@stackmate/engine/lib/entity';
import Parser from '@stackmate/engine/lib/parsers';
import { FORMAT } from '@stackmate/engine/constants';
import { Attribute } from '@stackmate/engine/lib/decorators';
import { StorageAdapter, AttributeParsers, Validations } from '@stackmate/engine/types';

class FileStorage extends Entity implements StorageAdapter {
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

  /**
   * @returns {Object} the parser functions to apply to the entity's attributes
   */
  parsers(): AttributeParsers {
    return {
      path: Parser.parsePath,
      format: Parser.parseString,
    };
  }

  /**
   * @returns {Validations} the validations for the entity
   */
  validations(): Validations {
    const formats = Object.values(FORMAT);

    return {
      path: {
        validatePathExistence: {
          required: true,
        },
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

export default FileStorage;
