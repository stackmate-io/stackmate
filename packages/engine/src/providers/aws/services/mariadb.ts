import AwsRdsService from '@stackmate/engine/providers/aws/services/rds';
import { PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';
import { AWS, CloudServiceConfiguration } from '@stackmate/engine/types';
import { mergeJsonSchemas, uniqueIdentifier } from '@stackmate/engine/lib/helpers';
import { RDS_DEFAULT_VERSIONS_PER_ENGINE, RDS_ENGINES, RDS_MAJOR_VERSIONS_PER_ENGINE } from '@stackmate/engine/providers/aws/constants';

class AwsMariaDbService extends AwsRdsService<AWS.MariaDB.Attributes> implements AWS.MariaDB.Type {
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

  static schema(): AWS.MariaDB.Schema {
    return mergeJsonSchemas(super.schema(), {
      properties: {
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

  /**
   * Returns the attributes to use when populating the initial configuration
   * @param {Object} options the options for the configuration
   * @returns {Object} the attributes
   */
  static config({ stageName = '' } = {}): CloudServiceConfiguration<AWS.MariaDB.Attributes> {
    return {
      provider: PROVIDER.AWS,
      type: SERVICE_TYPE.MARIADB,
      name: uniqueIdentifier(SERVICE_TYPE.MARIADB, { stageName }),
    };
  }
}

export default AwsMariaDbService;
