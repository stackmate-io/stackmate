import Entity from '@stackmate/lib/entity';
import { Attribute } from '@stackmate/lib/decorators';
import { parseString } from '@stackmate/lib/parsers';
import { AttributeParsers, Validations, VaultProviderChoice } from '@stackmate/types';

abstract class Vault extends Entity {
  /**
   * @var {String} project the vault's project name
   */
  @Attribute project: string;

  /**
   * @var {String} stage the vault's stage name
   */
  @Attribute stage: string;

  /**
   * @var {String} validationMessage the error message
   */
  readonly validationMessage: string = 'The secrets section contents are invalid';

  /**
   * @var {String} provider the providr for the vault
   */
  abstract provider: VaultProviderChoice;

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
