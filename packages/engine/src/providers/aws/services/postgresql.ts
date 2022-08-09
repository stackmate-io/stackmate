import AwsRdsService from '@stackmate/engine/providers/aws/services/rds';
import { AWS, CloudServiceConfiguration } from '@stackmate/engine/types';
import { SERVICE_TYPE } from '@stackmate/engine/constants';
import { mergeJsonSchemas } from '@stackmate/engine/lib/helpers';
import { RDS_DEFAULT_VERSIONS_PER_ENGINE, RDS_ENGINES, RDS_MAJOR_VERSIONS_PER_ENGINE } from '@stackmate/engine/providers/aws/constants';

class AwsPostgreSqlService extends AwsRdsService<AWS.PostgreSQL.Attributes> implements AWS.PostgreSQL.Type {
  /**
   * @var {String} schemaId the schema id for the entity
   * @static
   */
  static schemaId: string = 'services/aws/postgresql';

  /**
   * @var {String} type the type for the service
   */
  readonly type = SERVICE_TYPE.POSTGRESQL;

  /**
   * @var {String} version the version to provision
   */
  version: string = RDS_DEFAULT_VERSIONS_PER_ENGINE.get('postgres')!;

  /**
   * @var {Number} port the port to use for connecting
   */
  port: number = 5432;

  /**
   * @var {String} engine the engine for the database
   */
  readonly engine: Extract<typeof RDS_ENGINES[number], 'postgres'> = 'postgres';

  /**
   * @returns {BaseJsonSchema} provides the JSON schema to validate the entity by
   */
  static schema(): AWS.PostgreSQL.Schema {
    return mergeJsonSchemas(super.schema(), {
      $id: this.schemaId,
      properties: {
        type: {
          type: 'string',
          const: SERVICE_TYPE.POSTGRESQL,
        },
        database: {
          type: 'string',
        },
        version: {
          default: RDS_DEFAULT_VERSIONS_PER_ENGINE.get('postgres'),
          enum: RDS_MAJOR_VERSIONS_PER_ENGINE.get('postgres'),
        },
        port: {
          default: 3306,
        },
      }
    });
  }

  /**
   * @returns {Object} the attributes to use when populating the initial configuration
   */
  static config({ stageName = '' } = {}): CloudServiceConfiguration<AWS.PostgreSQL.Attributes> {
    return {
      ...super.config({ stageName }),
      type: SERVICE_TYPE.POSTGRESQL,
      name: 'postgres-database',
    };
  }
}

export default AwsPostgreSqlService;
