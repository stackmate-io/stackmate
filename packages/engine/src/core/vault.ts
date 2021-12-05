import Configuration from '@stackmate/core/configuration';
import { FORMAT, STORAGE } from '@stackmate/core/constants';
import { Vault as VaultInterface } from '@stackmate/interfaces';
import { Credentials } from '@stackmate/types';

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

  credentials(service: string): Credentials {
  }

  rootCredentials(service: string): Credentials {
  }
}

export default Vault;
