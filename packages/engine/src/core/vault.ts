import Configuration from '@stackmate/core/configuration';
import { VaultAttributes } from '@stackmate/types';
import { FORMAT, STORAGE } from '@stackmate/core/constants';
import { Validatable } from '@stackmate/interfaces';

class Vault extends Configuration {
  /**
   * @var {String} key the encryption key to use for encrypting / decrypting the values
   */
  readonly key: string;

  /**
   * @var {String} region the region to store the configuration
   */
  readonly region: string;

  constructor({ storage, path, key, region }: VaultAttributes = { storage: STORAGE.FILE }) {
    super({ storage, path })

    if (key) {
      this.key = key;
    }

    if (region) {
      this.region = region;
    }
  }

  get format(): string {
    if (this.storage === STORAGE.FILE) {
      return FORMAT.YML;
    }

    if (this.storage === STORAGE.AWS) {
      return FORMAT.RAW;
    }

    throw new Error(`Unsupported storage type ${this.storage} specified for the vault`);
  }
}

export default Vault;
