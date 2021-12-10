import { SERVICE_TYPE } from '@stackmate/constants';
import { ServiceTypeChoice } from '@stackmate/types';
import Service from '@stackmate/core/service';

abstract class Networking extends Service {
  /**
   * @var {String} type the type for the service
   */
  readonly type: ServiceTypeChoice = SERVICE_TYPE.DATABASE;
}

export default Networking;
