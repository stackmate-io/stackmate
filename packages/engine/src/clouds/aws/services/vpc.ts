import { SERVICE_TYPE } from 'core/constants';
import AwsService from 'clouds/aws/services/base';
import { ServiceTypeChoice } from 'types';

class AwsVpcService extends AwsService {
  readonly type: ServiceTypeChoice = SERVICE_TYPE.NETWORKING;

  provision() {
    // Add vpc, subnets etc
  }
}

export { AwsVpcService };
