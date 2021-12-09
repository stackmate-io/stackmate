import { RdsCluster } from '@cdktf/provider-aws';

import Database from '@stackmate/services/database';
import { OneOf, ProviderChoice, RegionList, ServiceTypeChoice } from '@stackmate/types';
import { PROVIDER, SERVICE_TYPE } from '@stackmate/constants';
import {
  AWS_REGIONS,
  DEFAULT_MYSQL_ENGINE,
  DEFAULT_POSTGRES_ENGINE,
  DEFAULT_RDS_INSTANCE_SIZE,
  DEFAULT_RDS_INSTANCE_STORAGE,
  RDS_INSTANCE_SIZES,
  RDS_MYSQL_ENGINES,
  RDS_POSTGRES_ENGINES,
} from '@stackmate/clouds/aws/constants';

abstract class AwsRdsService extends Database {
  /**
   * @var {String} provider the cloud provider for this service
   */
  readonly provider: ProviderChoice = PROVIDER.AWS;

  /**
   * @var {String} size the size for the RDS instance
   */
  size: string = DEFAULT_RDS_INSTANCE_SIZE;

  /**
   * @var {Number} storage the storage size for the instance
   */
  storage: number = DEFAULT_RDS_INSTANCE_STORAGE;

  /**
   * @var {RegionList} regions the regions that the service is available in
   */
  readonly regions: RegionList = AWS_REGIONS;

  /**
   * @var {Array<string>} sizes the list of RDS instance sizes
   */
  readonly sizes = RDS_INSTANCE_SIZES;

  /**
   * @var {String} engine the database engine to use
   */
  abstract engine: OneOf<Array<string>>;

  /**
   * @var {Array<String>} engines the list of database engines available for this service
   */
  abstract readonly engines: ReadonlyArray<string>;

  cluster: RdsCluster;
}

class AwsMysqlService extends AwsRdsService {
  /**
   * @var {String} type the type for the service
   */
  readonly type: ServiceTypeChoice = SERVICE_TYPE.MYSQL;

  /**
   * @var {Array<String>} engines the list of database engines available for this service
   */
  readonly engines: ReadonlyArray<string> = RDS_MYSQL_ENGINES;

  /**
   * @var {String} engine the engine to use
   */
  engine: OneOf<typeof RDS_MYSQL_ENGINES> = DEFAULT_MYSQL_ENGINE;

  provision() {
    // Add instance
    this.cluster = new RdsCluster(this.stack, 'my-rds-cluster', {
      // vpcSecurityGroupIds: [this.vpcId],
    });
  }
}

class AwsPostgresqlService extends AwsRdsService {
  /**
   * @var {String} type the type for the service
   */
  readonly type: ServiceTypeChoice = SERVICE_TYPE.POSTGRESQL;

  /**
   * @var {Array<String>} engines the list of database engines available for this service
   */
  readonly engines: ReadonlyArray<string> = RDS_POSTGRES_ENGINES;

  /**
   * @var {String} engine the engine to use
   */
  engine: OneOf<typeof RDS_POSTGRES_ENGINES> = DEFAULT_POSTGRES_ENGINE;

  provision() {
    // Add instance
  }
}

export {
  AwsMysqlService,
  AwsPostgresqlService,
};
