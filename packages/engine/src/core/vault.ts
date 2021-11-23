import Configuration from '@stackmate/core/configuration';
import { FORMAT, STORAGE } from '@stackmate/core/constants';

class Vault extends Configuration {
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
}

export default Vault;
