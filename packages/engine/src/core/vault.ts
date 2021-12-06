import Configuration from '@stackmate/core/configuration';
import { FORMAT, STORAGE } from '@stackmate/constants';
import { Vault as VaultInterface } from '@stackmate/interfaces';
import { Credentials, Validations } from '@stackmate/types';

class Vault extends Configuration implements VaultInterface {
  /**
   * @returns {String} the format to use
   */
  get format(): string {
    if (this.storage === STORAGE.FILE) {
      return FORMAT.YML;
    }

    if (this.storage === STORAGE.AWS_PARAMS) {
      return FORMAT.RAW;
    }

    throw new Error(`Unsupported storage type ${this.storage} specified for the vault`);
  }

  /**
   * @returns {String} the error message to use
   */
  getValidationError() {
    return 'The vault contents are invalid';
  }

  /**
   * @returns {Validations} the validation rules that apply
   */
  validations(): Validations {
    return {};
  }

  credentials(service: string): Credentials {
    return {};
  }

  rootCredentials(service: string): Credentials {
    return {};
  }
}

export default Vault;
