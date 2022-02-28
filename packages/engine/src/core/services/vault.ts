import Service from '@stackmate/core/service';
import { CloudStack } from '@stackmate/interfaces';
import { SERVICE_TYPE } from '@stackmate/constants';
import { ServiceTypeChoice } from '@stackmate/types';

abstract class Vault extends Service {
  /**
   * @var {String} type the type for the service
   */
  readonly type: ServiceTypeChoice = SERVICE_TYPE.VAULT;

  /**
   * @var {Boolean} isAuthenticatable the service should not use authentication
   */
  readonly isAuthenticatable: boolean = false;

  private registered: boolean = false;

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
    return this.registered;
  }

  onDeploy(stack: CloudStack): void {
    /* no-op - every change should be introduced through the username / password methods */
    this.registered = true;
  }
}

export default Vault;
