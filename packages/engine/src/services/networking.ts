import { DEFAULT_IP, SERVICE_TYPE } from '@stackmate/constants';
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
   * @var {String} ip the CIDR block to use as a base for the service
   */
  @Attribute ip: string = DEFAULT_IP;

  /**
   * Returns a CIDR block based on the service's IP
   *
   * @param {Number} bits the bits for the CIDR
   * @returns {String} the CIDR
   */
  protected cidr(bits: number): string {
    return `${this.ip}/${bits}`;
  }

  parsers() {
    return {
      ...super.parsers(),
      ip: parseString,
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
