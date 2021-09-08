import { SERVICE_TYPE } from 'core/constants';
import AwsService from 'clouds/aws/services/base';
import { ServiceTypeChoice } from 'types';
import { IService } from 'interfaces';

abstract class AwsRdsInstanceService extends AwsService {
}

class AwsMysqlService extends AwsRdsInstanceService {
  readonly type: ServiceTypeChoice = SERVICE_TYPE.MYSQL;

  provision() {
    // Add instance
  }

  associate(associations: Array<IService>) {
  }
}

class AwsPostgresqlService extends AwsRdsInstanceService {
  readonly type: ServiceTypeChoice = SERVICE_TYPE.POSTGRESQL;

  provision() {
    // Add instance
  }

  associate(associations: Array<IService>) {
  }
}


export {
  AwsMysqlService,
  AwsPostgresqlService,
};
