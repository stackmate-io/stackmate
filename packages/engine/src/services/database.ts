import Service from '@stackmate/core/service';
import { DEFAULT_STORAGE, SERVICE_TYPE } from '@stackmate/constants';
import { parseCredentials, parseInteger, parseString } from '@stackmate/lib/parsers';
import { Rootable, Sizeable, Storable, MultiNode, Versioned } from '@stackmate/interfaces';
import { CredentialsObject, DatabaseServiceAttributes, OneOf, ServiceTypeChoice } from '@stackmate/types';

abstract class Database extends Service implements Sizeable, Storable, Rootable, MultiNode, Versioned {
  /**
   * @var {String} type the type for the service
   */
  readonly type: ServiceTypeChoice = SERVICE_TYPE.DATABASE;

  /**
   * @var {String} size the size for the RDS instance
   */
  size: string;

  /**
   * @var {Number} storage the storage size for the instance
   */
  storage: number;

  /**
   * @var {String} version the database version to run
   */
  version: string;

  /**
   * @var {String} database the database to create
   */
  database: string;

  /**
   * @var {Number} nodes the number of nodes for the database;
   */
  nodes: number;

  /**
   * @var {Credentials} rootCredentials the service's root credentials
   */
  rootCredentials: CredentialsObject = {};

  /**
   * @var {String} engine the database engine to use
   */
  engine: OneOf<Array<string>>;

  /**
   * @var {Number} the port number to use to connect to the database
   */
  port: number;

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
   * @var {Number} defaultPort the default port to use
   * @abstract
   */
  abstract readonly defaultPort: number;

  /**
   * @var {String} defaultSize the default instance size to use for the service
   * @abstract
   */
  abstract readonly defaultSize: string;

  /**
   * @param {Object} attributes the attributes to parse
   * @returns {ServiceAttributes} the parsed attributes
   */
  parseAttributes(attributes: DatabaseServiceAttributes): DatabaseServiceAttributes {
    const {
      database,
      engine,
      version,
      nodes = 1,
      storage = DEFAULT_STORAGE,
      size = this.defaultSize,
      port = this.defaultPort,
      rootCredentials = {},
    } = attributes;

    return {
      ...super.parseAttributes(attributes),
      nodes: parseInteger(nodes),
      port: parseInteger(port),
      size: parseString(size),
      storage: parseInteger(storage),
      engine: parseString(engine),
      database: parseString(database),
      version: parseString(version),
      rootCredentials: parseCredentials(rootCredentials),
    };
  }

  /**
   * Returns the validations for the service
   *
   * @returns {Validations} the validations to run
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
      rootCredentials: {
        validateCredentials: true,
      },
    };
  }
}

export default Database;
