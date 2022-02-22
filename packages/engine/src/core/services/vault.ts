import Service from '@stackmate/core/service';
import { SERVICE_TYPE } from '@stackmate/constants';
import { ServiceTypeChoice } from '@stackmate/types';

abstract class Vault extends Service {
  /**
   * @var {String} type the type for the service
   */
  readonly type: ServiceTypeChoice = SERVICE_TYPE.VAULT;

  /**
   * Returns the username for a service
   *
   * @param {String} service the service to get the username for
   * @param {Boolean} root whether we intend to use the username for a root user
   */
  abstract username(service: string, root: boolean): string;

  /**
   * Returns the password for a service
   *
   * @param {String} service the service to get the password for
   */
  abstract password(service: string): string;

  /**
   * @returns {Boolean} whether the vault is registered in the stack
   */
  get isRegistered(): boolean {
    return true;
  }
}

export default Vault;
