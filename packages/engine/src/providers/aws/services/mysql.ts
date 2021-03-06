import AwsRdsService from '@stackmate/engine/providers/aws/services/rds';
import { AWS, CloudServiceConfiguration } from '@stackmate/engine/types';
import { PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';
import { mergeJsonSchemas, uniqueIdentifier } from '@stackmate/engine/lib/helpers';
import { RDS_DEFAULT_VERSIONS_PER_ENGINE, RDS_ENGINES, RDS_MAJOR_VERSIONS_PER_ENGINE } from '@stackmate/engine/providers/aws/constants';

class AwsMysqlService extends AwsRdsService<AWS.MySQL.Attributes> implements AWS.MySQL.Type {
  /**
   * @var {String} schemaId the schema id for the entity
   * @static
   */
  static schemaId: string = 'services/aws/mysql';

  /**
   * @var {String} type the type for the service
   */
  readonly type = SERVICE_TYPE.MYSQL;

  /**
   * @var {String} version the version to provision
   */
  version = RDS_DEFAULT_VERSIONS_PER_ENGINE.get('mysql')!;

  /**
   * @var {Number} port the port to use for connecting
   */
  port = 3306;

  /**
   * @var {String} engine the engine for the database
   */
  readonly engine: Extract<typeof RDS_ENGINES[number], 'mysql'> = 'mysql';

  /**
   * @returns {BaseJsonSchema} provides the JSON schema to validate the entity by
   */
  static schema(): AWS.MySQL.Schema {
    return mergeJsonSchemas(super.schema(), {
      $id: this.schemaId,
      properties: {
        type: {
          type: 'string',
          const: SERVICE_TYPE.MYSQL,
        },
        database: {
          type: 'string',
        },
        version: {
          type: 'string',
          default: RDS_DEFAULT_VERSIONS_PER_ENGINE.get('mysql'),
          enum: RDS_MAJOR_VERSIONS_PER_ENGINE.get('mysql'),
        },
        port: {
          type: 'number',
          default: 3306,
          minimum: 0,
          maximum: 65535,
        },
      }
    });
  }

  /**
   * @returns {Object} the attributes to use when populating the initial configuration
   */
  static config({ stageName = '' } = {}): CloudServiceConfiguration<AWS.MySQL.Attributes> {
    return {
      provider: PROVIDER.AWS,
      type: SERVICE_TYPE.MYSQL,
      name: uniqueIdentifier(SERVICE_TYPE.MYSQL, { stageName }),
    };
  }
}

export default AwsMysqlService;
