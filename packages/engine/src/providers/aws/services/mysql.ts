import { get } from 'lodash';

import AwsRdsService from '@stackmate/engine/providers/aws/services/rds';
import { AWS, CloudServiceConfiguration } from '@stackmate/engine/types';
import { PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';
import { mergeJsonSchemas, uniqueIdentifier } from '@stackmate/engine/lib/helpers';
import { RDS_DEFAULT_VERSIONS_PER_ENGINE, RDS_ENGINES, RDS_MAJOR_VERSIONS_PER_ENGINE } from '@stackmate/engine/providers/aws/constants';

class AwsMysqlService extends AwsRdsService<AWS.MySQL.Attributes> implements AWS.MySQL.Type {
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
   * @returns {Object} provides the structure to generate the JSON schema by
   */
  static schema(): AWS.MySQL.Schema {
    return mergeJsonSchemas(super.schema(), {
      properties: {
        type: {
          type: 'string',
          const: SERVICE_TYPE.MYSQL,
        },
        version: {
          type: 'string',
          default: get(RDS_DEFAULT_VERSIONS_PER_ENGINE, 'mysql'),
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

  /**
   * Returns the attributes to use when populating the initial configuration
   * @param {Object} options the options for the configuration
   * @returns {Object} the attributes
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
