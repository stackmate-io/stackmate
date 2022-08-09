import AwsRdsService from '@stackmate/engine/providers/aws/services/rds';
import { SERVICE_TYPE } from '@stackmate/engine/constants';
import { mergeJsonSchemas } from '@stackmate/engine/lib/helpers';
import { AWS, CloudServiceConfiguration } from '@stackmate/engine/types';
import { RDS_DEFAULT_VERSIONS_PER_ENGINE, RDS_ENGINES, RDS_MAJOR_VERSIONS_PER_ENGINE } from '@stackmate/engine/providers/aws/constants';

class AwsMariaDbService extends AwsRdsService<AWS.MariaDB.Attributes> implements AWS.MariaDB.Type {
  /**
   * @var {String} schemaId the schema id for the entity
   * @static
   */
  static schemaId: string = 'services/aws/mariadb';

  /**
   * @var {String} type the type for the service
   */
  readonly type = SERVICE_TYPE.MARIADB;

  /**
   * @var {String} version the version to provision
   */
  version: string = RDS_DEFAULT_VERSIONS_PER_ENGINE.get('mariadb')!;

  /**
   * @var {String} engine the engine for the database
   */
  readonly engine: Extract<typeof RDS_ENGINES[number], 'mariadb'> = 'mariadb';

  /**
   * @var {Number} port the port to use for connecting
   */
  port: number = 3306;

  /**
   * @returns {BaseJsonSchema} provides the JSON schema to validate the entity by
   */
  static schema(): AWS.MariaDB.Schema {
    return mergeJsonSchemas(super.schema(), {
      $id: this.schemaId,
      properties: {
        version: {
          default: RDS_DEFAULT_VERSIONS_PER_ENGINE.get('mariadb'),
          enum: RDS_MAJOR_VERSIONS_PER_ENGINE.get('mariadb'),
        },
        port: {
          default: 3306,
        },
      },
    });
  }

  /**
   * @returns {Object} the attributes to use when populating the initial configuration
   */
  static config({ stageName = '' } = {}): CloudServiceConfiguration<AWS.MariaDB.Attributes> {
    return {
      ...super.config({ stageName }),
      type: SERVICE_TYPE.MARIADB,
      name: 'mariadb-database',
    };
  }
}

export default AwsMariaDbService;
