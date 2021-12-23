import { DEFAULT_CIDR, SERVICE_TYPE } from '@stackmate/constants';
import { ServiceTypeChoice } from '@stackmate/types';
import Service from '@stackmate/core/service';

abstract class Networking extends Service {
  /**
   * @var {String} type the type for the service
   */
  readonly type: ServiceTypeChoice = SERVICE_TYPE.NETWORKING;

  /**
   * @var {String} cidr the CIDR block to use as a base for the service
   */
  public cidr: string = DEFAULT_CIDR;
}

export default Networking;
