import Loadable from '@stackmate/lib/loadable';
import { Attribute } from '@stackmate/lib/decorators';
import { CredentialsObject } from '@stackmate/types';

abstract class Vault extends Loadable {
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
   * @var {Object} data the secrets data
   */
  protected data: object;

  credentials(service: string): CredentialsObject {
    return {};
  }

  rootCredentials(service: string): CredentialsObject {
    return { username: 'abc123', password: 'abc' };
  }

  async load() {
    this.data = await this.storage.read();
  }
}

export default Vault;
