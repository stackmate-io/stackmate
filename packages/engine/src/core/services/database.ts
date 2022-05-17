import Service from '@stackmate/engine/core/service';
import Parser from '@stackmate/engine/lib/parsers';
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
   * @var {String} size the size for the database instance
   */
  abstract size: string;

  /**
   * @var {Number} the port number to use to connect to the database
   */
  abstract port: number;

  /**
   * @var {String} version the database version to run
   */
  abstract version: string;

  /**
   * @var {Array<String>} engines the list of database engines available for this service
   * @abstract
   */
  abstract readonly engines: ReadonlyArray<string>;

  /**
   * @var {Array<String>} sizes the list of available service sizes
   * @abstract
   */
  abstract readonly sizes: ReadonlyArray<string>;

  /**
   * @returns {Object} the parser functions to apply to the service's attributes
   */
  parsers() {
    return {
      ...super.parsers(),
      nodes: Parser.parseInteger,
      port: Parser.parseInteger,
      size: Parser.parseString,
      storage: Parser.parseInteger,
      engine: Parser.parseString,
      database: Parser.parseString,
      version: Parser.parseString,
    };
  }

  /**
   * @returns {Validations} the validations for the service
   */
  validations() {
    return {
      ...super.validations(),
      nodes: {
        numericality: {
          onlyInteger: true,
          greaterThan: 0,
          message: 'You have to provide the number of nodes for the database',
        },
      },
      size: {
        presence: {
          allowEmpty: false,
          message: 'You have to specify a size for the database instance(s)',
        },
        inclusion: {
          within: this.sizes,
          message: 'The instance size you provided is not a valid instance size',
        },
      },
      storage: {
        presence: {
          allowEmpty: false,
          message: 'You have to specify the storage for your instance(s)',
        },
      },
      version: {
        presence: {
          allowEmpty: false,
          message: 'You have to specify the database version to run',
        },
      },
      engine: {
        presence: {
          allowEmpty: false,
          message: 'You have to specify an engine to use',
        },
        inclusion: {
          within: this.engines,
          message: `The database engine is not valid. Available choices are: ${this.engines.join(', ')}`,
        },
      },
      port: {
        presence: {
          allowEmpty: false,
          message: 'You have to specify a port number for the database to connect',
        },
      },
      database: {
        format: {
          pattern: '([a-z0-9_]+)?',
          flags: 'i',
          message: 'You can only use letters, numbers and _ for the database name',
        },
      },
    };
  }

  /**
   * @returns {Object} the JSON schema to use for validation
   */
  static schema(): JsonSchema<DatabaseServiceSchema> {
    return mergeJsonSchemas<BaseServiceSchema, DatabaseServiceSchema>(super.schema(), {
      required: ['size', 'storage', 'port'],
      properties: {
        size: {
          type: 'string',
        },
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
