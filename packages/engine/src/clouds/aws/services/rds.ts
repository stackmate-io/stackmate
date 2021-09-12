import { ServiceTypeChoice } from 'types';
import { SERVICE_TYPE } from 'core/constants';
import AwsService from 'clouds/aws/services/base';
import { RdsCluster } from '@cdktf/provider-aws';

abstract class AwsRdsInstanceService extends AwsService {
}

class AwsMysqlService extends AwsRdsInstanceService {
  readonly type: ServiceTypeChoice = SERVICE_TYPE.MYSQL;

  cluster: RdsCluster;

  provision() {
    // Add instance
    this.cluster = new RdsCluster(this.stack, 'my-rds-cluster', {
      vpcSecurityGroupIds: [this.vpcId],
    });
  }
}

class AwsPostgresqlService extends AwsRdsInstanceService {
  readonly type: ServiceTypeChoice = SERVICE_TYPE.POSTGRESQL;

  provision() {
    // Add instance
  }
}

export {
  AwsMysqlService,
  AwsPostgresqlService,
};
