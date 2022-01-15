import { Memoize } from 'typescript-memoize';

import Vault from '@stackmate/core/vault';
import { STORAGE } from '@stackmate/constants';
import { StorageAdapter } from '@stackmate/interfaces';
import { getStoragAdaptereByType } from '@stackmate/storage';

class AwsParamsVault extends Vault {
  /**
    * @var {StorageAdapter} storageAdapter the storage adapter to fetch & push values
    */
  @Memoize() public get storage(): StorageAdapter {
    return getStoragAdaptereByType(STORAGE.AWS, {});
  }
}

export default AwsParamsVault;
