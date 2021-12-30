import Configuration from '@stackmate/core/configuration';
import { Vault as VaultInterface } from '@stackmate/interfaces';
import { AttributeParsers, CredentialsObject, Validations } from '@stackmate/types';

class Vault extends Configuration implements VaultInterface {
  /**
   * @var {String} validationMessage the error message
   */
  readonly validationMessage: string = 'The vault contents are invalid';

  /**
   * @returns {AttributeParsers}
   */
  parsers(): AttributeParsers {
    return {};
  }

  /**
   * @returns {Validations} the validation rules that apply
   */
  validations(): Validations {
    return {};
  }

  credentials(service: string): CredentialsObject {
    return {};
  }

  rootCredentials(service: string): CredentialsObject {
    return {};
  }
}

export default Vault;
