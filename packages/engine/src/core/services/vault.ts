import Service from '@stackmate/core/service';
import Credentials from '@stackmate/lib/credentials';
import { SERVICE_TYPE } from '@stackmate/constants';
import { CredentialsProvider } from '@stackmate/interfaces';
import { CredentialsKeyChoice, ServiceTypeChoice } from '@stackmate/types';

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
  protected username(service: string, root: boolean) { }

  /**
   * Returns the password for a service
   *
   * @param {String} service the service to get the password for
   */
  protected password(service: string) { }

  /**
   * Provides credentials for a service.
   * It returns a proxy, so that the credentials are not immediately provisioned,
   * but they get included in the stack, when eg. the username or password gets requested
   *
   * @param {String} service the service to provide credentials for
   * @param {Object} opts options
   * @param {Boolean} opts.root whether we need to get root credentials
   * @returns {Proxy<CredentialsProvider>}
   */
  for(service: string, { root = false }: { root: boolean }): CredentialsProvider {
    const handler: ProxyHandler<CredentialsProvider> = {
      get: (target: object, key: CredentialsKeyChoice, _receiver: object) => {
        if (key === 'username') {
          return this.username.apply(target, [service, root]);
        }

        if (key === 'password') {
          return this.password.apply(target, [service]);
        }

        throw new Error(`Invalid property ${key} specified`);
      },
    };

    return new Proxy(new Credentials(), handler);
  }
}

export default Vault;
