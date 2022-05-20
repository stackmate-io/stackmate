import AwsRdsService, { AttributeSet as ParentAttributeSet } from '@stackmate/engine/providers/aws/services/rds';
import { Attribute, AttributesOf, AwsMariaDBDatabaseService, JsonSchema, OneOf, ServiceTypeChoice } from '@stackmate/engine/types';
import { RDS_DEFAULT_VERSIONS_PER_ENGINE, RDS_ENGINES, RDS_MAJOR_VERSIONS_PER_ENGINE } from '@stackmate/engine/providers/aws/constants';
import { SERVICE_TYPE } from '@stackmate/engine/constants';
import { mergeJsonSchemas } from '@stackmate/engine/lib/helpers';

export type AttributeSet = AttributesOf<AwsMariaDBDatabaseService>;

class AwsMariaDbService extends AwsRdsService implements AwsMariaDBDatabaseService {
  /**
   * @var {String} type the type for the service
   */
  readonly type: ServiceTypeChoice = SERVICE_TYPE.MARIADB;

  /**
   * @var {String} engine the engine for the database
   */
  engine: Attribute<OneOf<typeof RDS_ENGINES>> = 'mariadb';

  /**
   * @var {String} version the version to provision
   */
  version: Attribute<string> = RDS_DEFAULT_VERSIONS_PER_ENGINE.get('mariadb')!;

  /**
   * @var {Number} port the port to use for connecting
   */
  port: Attribute<number> = 3306;

  static schema(): JsonSchema<AttributeSet> {
    return mergeJsonSchemas<ParentAttributeSet, AwsMariaDBDatabaseService>(super.schema(), {
      properties: {
        engine: {
          const: 'mariadb',
        },
        vesion: {
          default: RDS_DEFAULT_VERSIONS_PER_ENGINE.get('mariadb'),
          enum: RDS_MAJOR_VERSIONS_PER_ENGINE.get('mariadb'),
        },
        port: {
          default: 3306,
        },
      },
    });
  }
}

export default AwsMariaDbService;
