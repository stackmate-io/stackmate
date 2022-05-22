import { get } from 'lodash';

import AwsRdsService, { AttributeSet as ParentAttributeSet } from '@stackmate/engine/providers/aws/services/rds';
import { SERVICE_TYPE } from '@stackmate/engine/constants';
import { Attribute, AttributesOf, AwsMySQLDatabaseService, EntityTypeOf, JsonSchema, OneOf, ServiceTypeChoice } from '@stackmate/engine/types';
import { RDS_DEFAULT_VERSIONS_PER_ENGINE, RDS_ENGINES, RDS_MAJOR_VERSIONS_PER_ENGINE } from '@stackmate/engine/providers/aws/constants';
import { mergeJsonSchemas } from '@stackmate/engine/lib/helpers';

export type AttributeSet = AttributesOf<AwsMySQLDatabaseService>;

// Aws.MySQL.Type // Aws.MySQL.Schema // Aws.MySQL.Attributes

class AwsMysqlService extends AwsRdsService implements EntityTypeOf<AwsMySQLDatabaseService> {
  /**
   * @var {String} type the type for the service
   */
  readonly type: Attribute<ServiceTypeChoice> = SERVICE_TYPE.MYSQL;

  /**
   * @var {String} engine the engine for the database
   */
  engine: Attribute<OneOf<typeof RDS_ENGINES>> = 'mysql';

  /**
   * @var {String} version the version to provision
   */
  version = '8.0';

  /**
   * @var {Number} port the port to use for connecting
   */
  port = 3306;

  /**
   * @returns {Object} provides the structure to generate the JSON schema by
   */
  static schema(): JsonSchema<AttributeSet> {
    return mergeJsonSchemas<ParentAttributeSet, AttributeSet>(super.schema(), {
      properties: {
        type: {
          type: 'string',
          const: SERVICE_TYPE.MYSQL,
        },
        engine: {
          type: 'string',
          const: 'mysql',
        },
        version: {
          type: 'string',
          default: RDS_DEFAULT_VERSIONS_PER_ENGINE.get('mysql'),
          enum: get(RDS_MAJOR_VERSIONS_PER_ENGINE, 'mysql', []),
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
}

export default AwsMysqlService;
