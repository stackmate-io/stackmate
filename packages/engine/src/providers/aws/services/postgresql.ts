import AwsRdsService from '@stackmate/engine/providers/aws/services/rds';
import { OneOf, ServiceTypeChoice } from '@stackmate/engine/types';
import { RDS_DEFAULT_VERSIONS_PER_ENGINE, RDS_ENGINES } from '@stackmate/engine/providers/aws/constants';
import { Attribute } from '@stackmate/engine/lib/decorators';
import { SERVICE_TYPE } from '@stackmate/engine/constants';

class AwsPostgreSqlService extends AwsRdsService {
  /**
   * @var {String} type the type for the service
   */
  readonly type: ServiceTypeChoice = SERVICE_TYPE.POSTGRESQL;

  /**
   * @var {String} engine the engine for the database
   */
  @Attribute engine: OneOf<typeof RDS_ENGINES> = 'postgres';

  /**
   * @var {String} version the version to provision
   */
  @Attribute version: string = RDS_DEFAULT_VERSIONS_PER_ENGINE.get('postgres')!;

  /**
   * @var {Number} port the port to use for connecting
   */
  @Attribute port: number = 5432;
}

export default AwsPostgreSqlService;
