import { Memoize } from 'typescript-memoize';

import Vault from '@stackmate/core/vault';
import { AWS_REGIONS } from '@stackmate/providers/aws/constants';
import { STORAGE, VAULT_PROVIDER } from '@stackmate/constants';
import { CloudService, CredentialsResource, StorageAdapter } from '@stackmate/interfaces';
import { Attribute } from '@stackmate/lib/decorators';
import { parseString } from '@stackmate/lib/parsers';
import { getStoragAdaptereByType } from '@stackmate/storage';
import { AttributeParsers, Validations, VaultProviderChoice } from '@stackmate/types';

class AwsParamsVault extends Vault {
  provide(service: string, key: 'username' | 'password', root: boolean): CredentialsResource {
    throw new Error('Method not implemented.');
  }
  /**
   * @var {String} key the key arn to use for encryption / decryption
   */
  @Attribute key: string;

  /**
   * @var {String} region the region that the params are stored into
   */
  @Attribute region: string;

  /**
   * @var {String} provider the provider for the vault
   */
  provider: VaultProviderChoice = VAULT_PROVIDER.AWS;

  /**
   * @var {StorageAdapter} storageAdapter the storage adapter to fetch & push values
   */
  @Memoize() public get storage(): StorageAdapter {
    return getStoragAdaptereByType(STORAGE.AWS, {});
  }

  /**
   * @returnss {AttributeParsers}
   */
  parsers(): AttributeParsers {
    return {
      key: parseString,
      region: parseString,
    };
  }

  /**
   * @returns {String} the name space under which the variables are stored
   */
  public get namespace(): string {
    return '/abc/defg'; /** @todo */
    // `/${this.project}/${this.stage}`;
  }

  /**
   * @returns {Validations}
   */
  validations(): Validations {
    return {
      key: {
        presence: {
          message: 'A key in the form of a KMS ARN should be specified',
        },
        format: {
          pattern: '^arn:aws:[a-z0-9-:]+:[0-9]+(:[a-z0-9]+)?/[a-z0-9-]+$',
          flags: 'i',
          message: 'Please provide a valid KMS ARN (eg. arn:aws:eu-central-1:11111111/abc-123-abc)',
        },
      },
      region: {
        presence: {
          message: 'A region should be specified',
        },
        inclusion: {
          within: Object.values(AWS_REGIONS),
          message: 'The region specified is not valid',
        },
      },
    }
  }

  isRegistered: boolean;

  register(): void {
  }

  link(target: CloudService): void {
  }

  create(): void {
  }
}

export default AwsParamsVault;
