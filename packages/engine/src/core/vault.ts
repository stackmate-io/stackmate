import Entity from '@stackmate/lib/entity';
import { Bootstrappable, CloudService, CloudStack, VaultService } from '@stackmate/interfaces';
import { AttributeParsers, CredentialsObject, Validations, VaultProviderChoice } from '@stackmate/types';

abstract class Vault extends Entity implements VaultService, Bootstrappable {
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
   * Registers the vault into the stack
   */
  abstract register(): void;

  /**
   * Bootstraps the vault
   */
  abstract bootstrap(): void;

  constructor(stack: CloudStack) {
    super();

    this.stack = stack;
  }

  /**
   * @returns {String} the project's name
   */
  public get project(): string {
    return this.stack.appName;
  }

  /**
   * @returns {String} the stage's name
   */
  public get stage() : string {
    return this.stack.name;
  }

  /**
   * @var {String} identifier the vault's identifier
   */
  get identifier(): string {
    return `vault-${this.provider}-${this.stage}`;
  }

  rotate(service: string, root: boolean = false) {
  }

  provide(service: string, credentials: CredentialsObject, root: boolean = false) {
  }

  /**
   * Links a given service to the vault
   *
   * @param {Service} target the service to link the current service with
   */
  link(target: CloudService): void {
  }
}

export default Vault;
