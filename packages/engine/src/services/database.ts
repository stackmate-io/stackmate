import Service from '@stackmate/core/service';
import { SERVICE_TYPE } from '@stackmate/constants';
import { parseCredentials, parseInteger, parseString } from '@stackmate/lib/parsers';
import { Authenticatable, Rootable, Sizeable, Storable, MultiNode } from '@stackmate/interfaces';
import { CredentialsObject, DatabaseServiceAttributes, OneOf, ServiceTypeChoice } from '@stackmate/types';

abstract class Database extends Service implements Sizeable, Storable, Authenticatable, Rootable, MultiNode {
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
   * @var {String} database the database to create
   */
  database: string;

  /**
   * @var {Number} nodes the number of nodes for the database;
   */
  nodes: number;

  /**
   * @var {Credentials} credentials the service's credentials
   */
  credentials: CredentialsObject = {};

  /**
   * @var {Credentials} rootCredentials the service's root credentials
   */
  rootCredentials: CredentialsObject = {};

  /**
   * @var {String} engine the database engine to use
   */
  engine: OneOf<Array<string>>;

  /**
   * @var {Array<String>} engines the list of database engines available for this service
   */
  abstract readonly engines: ReadonlyArray<string>;

  /**
   * @var {Array<String>} sizes the list of available service sizes
   */
  abstract readonly sizes: ReadonlyArray<string>;

  /**
   * @param {Object} attributes the attributes to parse
   * @returns {ServiceAttributes} the parsed attributes
   */
  parseAttributes(attributes: DatabaseServiceAttributes): DatabaseServiceAttributes {
    const { nodes, size, storage, engine, database, credentials, rootCredentials } = attributes;

    return {
      ...super.parseAttributes(attributes),
      nodes: parseInteger(nodes || 1),
      size: parseString(size || ''),
      storage: parseInteger(storage || 0),
      engine: parseString(engine),
      database: parseString(database),
      credentials: parseCredentials(credentials || {}),
      rootCredentials: parseCredentials(rootCredentials || {}),
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
      database: {
        format: {
          pattern: '([a-z0-9_]+)?',
          flags: 'i',
          message: 'You can only use letters, numbers and _ for the database name',
        },
      },
      credentials: {
        validateCredentials: true,
      },
      rootCredentials: {
        validateCredentials: true,
      },
    };
  }
}

export default Database;
