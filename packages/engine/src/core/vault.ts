import Entity from '@stackmate/lib/entity';
import { Attribute } from '@stackmate/lib/decorators';
import { CredentialsObject } from '@stackmate/types';
import { Loadable, StorageAdapter } from '@stackmate/interfaces';

abstract class Vault extends Entity implements Loadable {
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
  readonly validationMessage: string = 'The vault contents are invalid';

  /**
   * @var {StorageAdapter} storage the storage adapter to use
   */
  abstract storage: StorageAdapter;

  /**
   * @var {Object} secrets the secrets in the remote storage
   */
  protected secrets: object;

  credentials(service: string): CredentialsObject {
    return {};
  }

  rootCredentials(service: string): CredentialsObject {
    return {};
  }

  /**
   * Loads the project attributes from the file storage
   * @void
   */
  async load(): Promise<void> {
    const secrets = await this.storage.read();
    this.secrets = this.storage.deserialize(secrets);
  }
}

export default Vault;
