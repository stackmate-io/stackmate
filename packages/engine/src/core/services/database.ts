import Service from '@stackmate/engine/core/service';
import { Attribute } from '@stackmate/engine/lib/decorators';
import { mergeJsonSchemas } from '@stackmate/engine/lib/helpers';
import { DEFAULT_SERVICE_STORAGE } from '@stackmate/engine/constants';
import { JsonSchema, BaseServiceSchema, DatabaseServiceSchema, DatabaseService } from '@stackmate/engine/types';

abstract class Database extends Service implements DatabaseService {
  /**
   * @var {Number} storage the storage size for the instance
   */
  @Attribute storage: number;

  /**
   * @var {String} database the database to create
   */
  @Attribute database: string;

  /**
   * @var {Number} the port number to use to connect to the database
   */
  @Attribute port: number;

  /**
   * @var {String} size the size for the database instance
   */
  abstract size: string;

  /**
   * @var {String} version the database version to run
   */
  abstract version: string;

  /**
   * @returns {Object} the JSON schema to use for validation
   */
  static schema(): JsonSchema<DatabaseServiceSchema> {
    return mergeJsonSchemas<BaseServiceSchema, DatabaseServiceSchema>(super.schema(), {
      required: ['storage', 'port'],
      properties: {
        storage: {
          type: 'number',
          default: DEFAULT_SERVICE_STORAGE,
        },
        database: {
          type: 'string',
          pattern: '[a-z0-9_]+',
        },
        port: {
          type: 'number',
          minimum: 0,
          maximum: 65535,
        },
      },
    });
  }
}

export default Database;
