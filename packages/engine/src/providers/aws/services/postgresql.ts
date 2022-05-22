import AwsRdsService, { AttributeSet as ParentAttributeSet } from '@stackmate/engine/providers/aws/services/rds';
import { Attribute, AttributesOf, JsonSchema, OneOf, ServiceTypeChoice } from '@stackmate/engine/types';
import { RDS_DEFAULT_VERSIONS_PER_ENGINE, RDS_ENGINES, RDS_MAJOR_VERSIONS_PER_ENGINE } from '@stackmate/engine/providers/aws/constants';
import { SERVICE_TYPE } from '@stackmate/engine/constants';
import { mergeJsonSchemas } from '@stackmate/engine/lib/helpers';
import { get } from 'lodash';

type AttributeSet = AttributesOf<AwsPostgreSqlService>;

class AwsPostgreSqlService extends AwsRdsService implements AwsPostgreSqlService {
  /**
   * @var {String} type the type for the service
   */
  readonly type: Attribute<ServiceTypeChoice> = SERVICE_TYPE.POSTGRESQL;

  /**
   * @var {String} engine the engine for the database
   */
  engine: Attribute<OneOf<typeof RDS_ENGINES>> = 'postgres';

  /**
   * @var {String} version the version to provision
   */
  version: Attribute<string> = RDS_DEFAULT_VERSIONS_PER_ENGINE.get('postgres')!;

  /**
   * @var {Number} port the port to use for connecting
   */
  port: Attribute<number> = 5432;

  /**
   * @returns {Object} provides the structure to generate the JSON schema by
   */
  static schema(): JsonSchema<AttributeSet> {
    return mergeJsonSchemas<ParentAttributeSet, AttributeSet>(super.schema(), {
      properties: {
        type: {
          type: 'string',
          const: SERVICE_TYPE.POSTGRESQL,
        },
        engine: {
          type: 'string',
          const: 'postgres',
        },
        version: {
          default: RDS_DEFAULT_VERSIONS_PER_ENGINE.get('postgres'),
          enum: get(RDS_MAJOR_VERSIONS_PER_ENGINE, 'postgres', []),
        },
        port: {
          default: 3306,
        },
      }
    });
  }
}

export default AwsPostgreSqlService;
