import Configuration from '@stackmate/core/configuration';
import { Vault as VaultInterface } from '@stackmate/interfaces';
import { Attribute } from '@stackmate/lib/decorators';
import { parseObject } from '@stackmate/lib/parsers';
import { AttributeParsers, CredentialsObject, Validations } from '@stackmate/types';

class Vault extends Configuration implements VaultInterface {
  /**
   * @var {String} validationMessage the error message
   */
  readonly validationMessage: string = 'The vault contents are invalid';

  @Attribute params: object;

  /**
   * @returns {AttributeParsers}
   */
  parsers(): AttributeParsers {
    return {
      params: parseObject,
    };
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
    return { username: 'abc123', password: 'abc' };
  }
}

export default Vault;
