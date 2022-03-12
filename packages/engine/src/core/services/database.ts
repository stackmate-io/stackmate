import Service from '@stackmate/core/service';
import Parser from '@stackmate/lib/parsers';
import { Attribute } from '@stackmate/lib/decorators';
import { SERVICE_TYPE } from '@stackmate/constants';
import { OneOf, ServiceTypeChoice } from '@stackmate/types';
import { Sizeable, Storable, MultiNode, Versioned } from '@stackmate/interfaces';

abstract class Database extends Service implements Sizeable, Storable, MultiNode, Versioned {
  /**
   * @var {String} type the type for the service
   */
  readonly type: ServiceTypeChoice = SERVICE_TYPE.DATABASE;

  /**
   * @var {String} size the size for the RDS instance
   */
  @Attribute size: string;

  /**
   * @var {Number} storage the storage size for the instance
   */
  @Attribute storage: number;

  /**
   * @var {String} version the database version to run
   */
  @Attribute version: string;

  /**
   * @var {String} database the database to create
   */
  @Attribute database: string;

  /**
   * @var {Number} nodes the number of nodes for the database;
   */
  @Attribute nodes: number;

  /**
   * @var {String} engine the database engine to use
   */
  @Attribute engine: OneOf<Array<string>>;

  /**
   * @var {Number} the port number to use to connect to the database
   */
  @Attribute port: number;

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
}

export default Database;
