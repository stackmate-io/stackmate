import Entity from '@stackmate/lib/entity';
import Credentials from '@stackmate/lib/credentials';
import { CloudStack, CredentialsProvider, CredentialsResource, VaultService } from '@stackmate/interfaces';
import { AttributeParsers, CredentialsCollection, CredentialsKeyChoice, Validations, VaultProviderChoice } from '@stackmate/types';

abstract class Vault extends Entity implements VaultService {
  /**
   * @var {CloudStack} stack the stack to apply the changes to
   */
  public stack: CloudStack;

  /**
   * @var {String} validationMessage the error message
   */
  readonly validationMessage: string = 'The secrets section contents are invalid';

  /**
   * @var {String} provider the providr for the vault
   */
  abstract provider: VaultProviderChoice;

  /**
   * @var {Boolean} isRegistered whether the vault is registered or not
   */
  abstract readonly isRegistered: boolean;

  /**
   * @returns {AttributeParsers} the attribute parsers for the entity
   */
  abstract parsers(): AttributeParsers;

  /**
   * @returns {Validations} the validations for the entity
   */
  abstract validations(): Validations;

  /**
   * @var {CredentialsCollection} assigned the user-assigned credentials collection
   */
  protected assigned: CredentialsCollection;

  /**
   * Provisions a credentials resource, either a username or password
   *
   * @param {String} service the service to provide the credentials for
   * @param {String} key
   * @param {Boolean} root whether we're creating root credentials for
   */
  abstract provide(service: string, key: CredentialsKeyChoice, root: boolean): CredentialsResource;

  /**
   * @constructor
   * @param {CloudStack} stack the stack to provision resources on
   * @param {CredentialsCollection} assigned any assigned credentials
   */
  constructor(stack: CloudStack, assigned?: CredentialsCollection) {
    super();

    this.stack = stack;
    this.assigned = assigned || {};
  }

  /**
   * Returns the username for a service
   *
   * @param {String} service the service to get the username for
   * @param {Boolean} root whether we intend to use the username for a root user
   */
  protected username(service: string, root: boolean) {}

  /**
   * Returns the password for a service
   *
   * @param {String} service the service to get the password for
   */
  protected password(service: string) {}

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
      get: (_target: object, key: CredentialsKeyChoice, _receiver: object) => (
        this.provide(service, key, root)
      ),
    };

    return new Proxy(new Credentials(), handler);
  }
}

export default Vault;
