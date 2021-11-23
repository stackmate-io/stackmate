import { DataAwsSsmParameter, RdsCluster } from '@cdktf/provider-aws';

import AwsService from '@stackmate/clouds/aws/services/base';
import { OneOf, ServiceTypeChoice } from '@stackmate/types';
import { SERVICE_TYPE } from '@stackmate/core/constants';
import { Sizeable, Storable } from '@stackmate/interfaces';
import { parseInteger, parseString } from '@stackmate/core/utils';
import {
  DEFAULT_MYSQL_ENGINE,
  DEFAULT_POSTGRES_ENGINE,
  DEFAULT_RDS_INSTANCE_SIZE,
  DEFAULT_RDS_INSTANCE_STORAGE,
  RDS_INSTANCE_SIZES,
  RDS_MYSQL_ENGINES,
  RDS_POSTGRES_ENGINES,
} from '@stackmate/clouds/aws/constants';

abstract class AwsRdsInstanceService extends AwsService implements Sizeable, Storable {
  /**
   * @var {String} size the size for the RDS instance
   */
  size: string = DEFAULT_RDS_INSTANCE_SIZE;

  /**
   * @var {Number} storage the storage size for the instance
   */
  storage: number = DEFAULT_RDS_INSTANCE_STORAGE;

  /**
   * @var {String} database the database to create
   */
  database: string;

  /**
   * @var {String} engine the database engine to use
   */
  abstract engine: OneOf<Array<string>>;

  /**
   * @var {Array<String>} engines the list of database engines available for this service
   */
  abstract readonly engines: ReadonlyArray<string>;

  cluster: RdsCluster;

  attributeNames() {
    return {
      ...super.attributeNames(),
      size: parseString,
      storage: parseInteger,
      engine: parseString,
      database: parseString,
    };
  }

  validations() {
    return {
      ...super.validations(),
      size: {
        presence: {
          allowEmpty: false,
          message: 'You have to specify a size for the RDS instance',
        },
        inclusion: {
          within: RDS_INSTANCE_SIZES,
          message: 'The instance size you provided is not a valid RDS instance size',
        },
      },
      storage: {
        presence: {
          allowEmpty: false,
          message: 'You have to specify the storage for your RDS instance',
        },
      },
      engine: {
        presence: {
          allowEmpty: false,
          message: 'You have to specify an engine to use',
        },
        inclusion: {
          within: this.engines,
          message: `The database engine is not valid. Available choices are: ${this.engines.join(', ')}`,
        },
      },
      database: {
        format: {
          pattern: '([a-z0-9_]+)?',
          flags: 'i',
          message: 'You can only use letters, numbers and _ for the database name',
        },
      },
    };
  }
}

class AwsMysqlService extends AwsRdsInstanceService {
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
      vpcSecurityGroupIds: [this.vpcId],
    });
  }
}

class AwsPostgresqlService extends AwsRdsInstanceService {
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
