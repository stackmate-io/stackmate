import Entity from '@stackmate/lib/entity';
import { Attribute } from '@stackmate/lib/decorators';
import { parseString } from '@stackmate/lib/parsers';
import { CloudService, CloudStack, VaultService } from '@stackmate/interfaces';
import { AttributeParsers, Validations, VaultProviderChoice } from '@stackmate/types';

abstract class Vault extends Entity implements VaultService {
  /**
   * @var {String} project the vault's project name
   */
  @Attribute project: string;

  /**
   * @var {String} stage the stage's name
   */
  @Attribute stage: string;

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
   * @var {Boolean} isProvisioned whether the vault is provisioned or not
   */
  abstract readonly isProvisioned: boolean;

  /**
   * Provisions the vault
   */
  abstract provision(): void;

  /**
   * Links the vault with a given service
   *
   * @param {Service} target the service to link the current service with
   */
  abstract link(target: CloudService): void;

  /**
   * Creates the vault to be used in future provisions
   */
  abstract create(): void;

  constructor(stack: CloudStack) {
    super();

    this.stack = stack;
  }

  /**
   * @var {String} identifier the vault's identifier
   */
  get identifier(): string {
    return `vault-${this.provider}-${this.stage}`;
  }

  parsers(): AttributeParsers {
    return {
      project: parseString,
      stage: parseString,
    };
  }

  validations(): Validations {
    return {
      project: {
        presence: {
          allowEmpty: false,
          message: 'You have to provide a project name for the secrets section',
        },
      },
      stage: {
        presence: {
          allowEmpty: false,
          message: 'You have to provide a stage name for the secrets section',
        },
      },
    };
  }
}

export default Vault;
