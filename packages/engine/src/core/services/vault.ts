import Service from '@stackmate/core/service';
import { CloudStack, VaultService } from '@stackmate/interfaces';
import { SERVICE_TYPE } from '@stackmate/constants';
import { ServiceTypeChoice } from '@stackmate/types';

abstract class Vault extends Service implements VaultService {
  /**
   * @var {String} type the type for the service
   */
  readonly type: ServiceTypeChoice = SERVICE_TYPE.VAULT;

  /**
   * @var {Boolean} isAuthenticatable the service should not use authentication
   */
  readonly isAuthenticatable: boolean = false;

  /**
   * @var {Boolean} registered whether the service is registered into the stack
   */
  private registered: boolean = false;

  /**
   * Provides credentials for a service
   *
   * @param {String} service the service to provide credentials for
   * @param {Boolean} root whether the credentials are root credentials
   * @returns {Object} the username / password pair
   */
  abstract credentials(service: string, root: boolean): { username: string; password: string };

  /**
   * @returns {Boolean} whether the vault is registered in the stack
   */
  get isRegistered(): boolean {
    return this.registered;
  }

  onDeploy(stack: CloudStack): void {
    /* no-op - every change should be introduced through the username / password methods */
    this.registered = true;
  }
}

export default Vault;
