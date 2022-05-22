import AwsRdsService from '@stackmate/engine/providers/aws/services/rds';
import { AWS, OneOf } from '@stackmate/engine/types';
import { SERVICE_TYPE } from '@stackmate/engine/constants';
import { mergeJsonSchemas } from '@stackmate/engine/lib/helpers';
import { RDS_DEFAULT_VERSIONS_PER_ENGINE, RDS_ENGINES, RDS_MAJOR_VERSIONS_PER_ENGINE } from '@stackmate/engine/providers/aws/constants';

class AwsMariaDbService extends AwsRdsService implements AWS.MariaDB.Type {
  /**
   * @var {String} type the type for the service
   */
  readonly type = SERVICE_TYPE.MARIADB;

  /**
   * @var {String} engine the engine for the database
   */
  engine: OneOf<typeof RDS_ENGINES> = 'mariadb';

  /**
   * @var {String} version the version to provision
   */
  version: string = RDS_DEFAULT_VERSIONS_PER_ENGINE.get('mariadb')!;

  /**
   * @var {Number} port the port to use for connecting
   */
  port: number = 3306;

  static schema(): AWS.MariaDB.Schema {
    return mergeJsonSchemas(super.schema(), {
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
