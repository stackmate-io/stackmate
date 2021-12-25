import { DEFAULT_CIDR, SERVICE_TYPE } from '@stackmate/constants';
import { ServiceTypeChoice } from '@stackmate/types';
import Service from '@stackmate/core/service';
import { Attribute } from '@stackmate/lib/decorators';
import { parseString } from '@stackmate/lib/parsers';

abstract class Networking extends Service {
  /**
   * @var {String} type the type for the service
   */
  readonly type: ServiceTypeChoice = SERVICE_TYPE.NETWORKING;

  /**
   * @var {String} cidr the CIDR block to use as a base for the service
   */
  @Attribute cidr: string = DEFAULT_CIDR;

  parsers() {
    return {
      ...super.parsers(),
      cidr: parseString,
    };
  }

  validations() {
    return {
      ...super.validations(),
      cidr: {
        presence: {
          allowEmpty: false,
          message: 'You should define a CIDR block for the networking',
        },
      },
    }
  }
}

export default Networking;
