import Service from '@stackmate/core/service';
import Parser from '@stackmate/lib/parsers';
import { DEFAULT_IP, SERVICE_TYPE } from '@stackmate/constants';
import { ServiceTypeChoice } from '@stackmate/types';
import { Attribute } from '@stackmate/lib/decorators';

abstract class Networking extends Service {
  /**
   * @var {String} type the type for the service
   */
  readonly type: ServiceTypeChoice = SERVICE_TYPE.NETWORKING;

  /**
   * @var {String} ip the CIDR block to use as a base for the service
   */
  @Attribute ip: string = DEFAULT_IP;

  parsers() {
    return {
      ...super.parsers(),
      ip: Parser.parseString,
    };
  }

  validations() {
    return {
      ...super.validations(),
      ip: {
        presence: {
          allowEmpty: false,
          message: 'You should define an IP to use as a CIDR block for the networking',
        },
        format: {
          pattern: '^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$',
          message: 'Please provide a valid IPv4 IP for the networking service',
        }
      },
    };
  }
}

export default Networking;
